import re
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai.base import (
    AIProviderError,
    AIRequest,
    AIResponse,
    InvalidRequestError,
    ProviderAuthError,
    ProviderUnavailableError,
    QuotaExceededError,
    RateLimitError,
)
from app.ai.gateway import AIGateway, ai_gateway
from app.config import settings
from app.core.exceptions import InvalidParameterError
from app.core.logging import logger
from app.search.ranking import tokenize
from app.search.schemas import SearchQueryFilters, SearchResultItem
from app.search.service import KnowledgeSearchService
from app.tutor.prompts import (
    build_grounded_user_prompt,
    build_tutor_system_instruction,
)
from app.tutor.schemas import (
    AIResultMetadata,
    AIUsageMetadata,
    KnowledgeConfidence,
    KnowledgeResultMetadata,
    SourceCitation,
    TutorRequest,
    TutorResponse,
)


class AITutorService:
    """
    Core AI Tutor Service orchestrating:
    1. Deterministic IKSHOVIA Knowledge Retrieval
    2. Relevance scoring & confidence classification (STRONG / WEAK / NONE)
    3. AI Usage Optimization (Bypasses LLM when retrieved knowledge is sufficient)
    4. Grounded AI synthesis via Provider-Agnostic AI Gateway when needed
    5. Graceful fallback on provider quota/rate-limit errors without crashing
    """

    def __init__(self, gateway: Optional[AIGateway] = None):
        self._gateway = gateway or ai_gateway

    async def process_query(
        self,
        db: AsyncSession,
        request: TutorRequest,
        gateway_override: Optional[AIGateway] = None,
    ) -> TutorResponse:
        """
        Processes a user question with complete knowledge retrieval before any AI model call.
        """
        clean_message = (request.message or "").strip()
        if not clean_message:
            raise InvalidParameterError(
                message="Tutor query message cannot be empty",
                details={"field": "message"},
            )

        active_gateway = gateway_override or self._gateway

        # -------------------------------------------------------------
        # 1. Execute Deterministic Knowledge Search
        # -------------------------------------------------------------
        search_filters = SearchQueryFilters(
            exam=request.exam,
            subject=request.subject,
            topic=request.topic,
        )

        try:
            search_response = await KnowledgeSearchService.search(
                db=db,
                query=clean_message,
                filters=search_filters,
                page=1,
                page_size=10,
            )
            raw_results = search_response.results
        except Exception as e:
            logger.warn(f"[AITutorService] Knowledge search failed or was empty: {e}")
            raw_results = []

        # -------------------------------------------------------------
        # 2. Score & Classify Retrieval Confidence
        # -------------------------------------------------------------
        citations = self._build_deduplicated_citations(raw_results)
        top_score = citations[0].score if citations else 0.0

        if top_score >= settings.KNOWLEDGE_STRONG_SCORE_THRESHOLD:
            confidence = KnowledgeConfidence.STRONG
        elif top_score >= settings.KNOWLEDGE_WEAK_SCORE_THRESHOLD:
            confidence = KnowledgeConfidence.WEAK
        else:
            confidence = KnowledgeConfidence.NONE

        knowledge_meta = KnowledgeResultMetadata(
            used=bool(citations and confidence != KnowledgeConfidence.NONE),
            result_count=len(citations) if confidence != KnowledgeConfidence.NONE else 0,
            confidence=confidence.value,
            sources=citations if confidence != KnowledgeConfidence.NONE else [],
        )

        # -------------------------------------------------------------
        # 3. Decision Engine: Should we call the AI Provider?
        # -------------------------------------------------------------
        # Optimization: If we have STRONG verified knowledge and force_ai is not explicitly requested,
        # we construct a direct grounded answer from IKSHOVIA data WITHOUT calling the AI model.
        if confidence == KnowledgeConfidence.STRONG and not request.force_ai:
            direct_answer = self._format_direct_knowledge_answer(clean_message, citations)
            return TutorResponse(
                success=True,
                answer=direct_answer,
                confidence=confidence.value,
                knowledge=knowledge_meta,
                ai=AIResultMetadata(
                    used=False,
                    provider=None,
                    model=None,
                    usage=AIUsageMetadata(
                        input_tokens=0,
                        output_tokens=0,
                        total_tokens=0,
                        latency_ms=0,
                    ),
                    error=None,
                ),
            )

        # -------------------------------------------------------------
        # 4. Invoke AI Gateway (Grounded Synthesis or General Knowledge)
        # -------------------------------------------------------------
        provider_name = request.provider or settings.AI_PROVIDER or "gemini"
        try:
            provider = active_gateway.get_provider(provider_name)
        except Exception as prov_err:
            logger.warn(f"[AITutorService] Provider resolution failed: {prov_err}")
            return self._build_provider_fallback_response(
                clean_message=clean_message,
                confidence=confidence,
                knowledge_meta=knowledge_meta,
                citations=citations,
                error_msg="AI provider is not available or registered.",
            )

        # Build prompt & system instruction
        system_instruction = build_tutor_system_instruction(
            exam=request.exam,
            subject=request.subject,
            topic=request.topic,
            mode=request.mode or "tutor",
        )
        user_prompt = build_grounded_user_prompt(
            user_query=clean_message,
            citations=citations if confidence != KnowledgeConfidence.NONE else [],
            confidence=confidence.value,
        )

        ai_request = AIRequest(
            prompt=user_prompt,
            system_instruction=system_instruction,
            temperature=0.2,
            max_tokens=1200,
            metadata={"exam": request.exam, "mode": request.mode, "mock_mode": request.mock_mode},
        )

        try:
            ai_res = await provider.generate(ai_request)
            usage_meta = None
            if ai_res.usage:
                usage_meta = AIUsageMetadata(
                    input_tokens=ai_res.usage.input_tokens,
                    output_tokens=ai_res.usage.output_tokens,
                    total_tokens=ai_res.usage.total_tokens,
                    latency_ms=ai_res.usage.latency_ms,
                )

            return TutorResponse(
                success=True,
                answer=ai_res.text,
                confidence=confidence.value,
                knowledge=knowledge_meta,
                ai=AIResultMetadata(
                    used=True,
                    provider=ai_res.provider,
                    model=ai_res.model,
                    usage=usage_meta,
                    error=None,
                ),
            )

        except (RateLimitError, QuotaExceededError, ProviderUnavailableError, ProviderAuthError, AIProviderError) as ai_err:
            logger.warn(f"[AITutorService] AI Provider error handled gracefully: {type(ai_err).__name__}: {ai_err.message}")
            return self._build_provider_fallback_response(
                clean_message=clean_message,
                confidence=confidence,
                knowledge_meta=knowledge_meta,
                citations=citations,
                error_msg=f"AI synthesis unavailable ({ai_err.message})",
            )
        except Exception as unk_err:
            logger.error(f"[AITutorService] Unexpected error during AI generation: {unk_err}")
            return self._build_provider_fallback_response(
                clean_message=clean_message,
                confidence=confidence,
                knowledge_meta=knowledge_meta,
                citations=citations,
                error_msg="Temporary AI gateway service disruption",
            )

    def _build_deduplicated_citations(
        self,
        results: List[SearchResultItem],
    ) -> List[SourceCitation]:
        """
        Deduplicates results and bounds context to the top configured items.
        """
        citations: List[SourceCitation] = []
        seen_hashes = set()

        max_items = settings.KNOWLEDGE_MAX_CONTEXT_ITEMS
        max_snippet_len = settings.KNOWLEDGE_MAX_SNIPPET_LENGTH

        for item in results:
            # Normalize content hash to avoid duplicate overlapping chunks
            clean_snippet = item.content.strip()
            content_sig = clean_snippet[:100].lower()
            if content_sig in seen_hashes:
                continue
            seen_hashes.add(content_sig)

            meta = item.metadata or {}
            source_name = meta.get("source_name") or meta.get("source_code") or meta.get("authority")
            source_url = meta.get("source_url") or meta.get("url")
            pub_date = meta.get("published_at") or (f"Year {meta.get('pyq_year')}" if meta.get("pyq_year") else None)

            # Bound snippet size
            bounded_snippet = clean_snippet[:max_snippet_len]
            if len(clean_snippet) > max_snippet_len:
                bounded_snippet += "..."

            citation = SourceCitation(
                id=item.id,
                type=item.type,
                title=item.title,
                source_name=str(source_name) if source_name else None,
                source_url=str(source_url) if source_url else None,
                published_at=str(pub_date) if pub_date else None,
                resource_id=item.resource_id,
                document_id=item.document_id,
                snippet=bounded_snippet,
                score=round(item.score, 4),
            )
            citations.append(citation)

            if len(citations) >= max_items:
                break

        return citations

    def _format_direct_knowledge_answer(
        self,
        query: str,
        citations: List[SourceCitation],
    ) -> str:
        """
        Constructs a structured, high-quality knowledge response directly from
        verified IKSHOVIA data when knowledge relevance is strong.
        """
        primary = citations[0]
        paragraphs = [
            f"### Verified Knowledge Summary: {primary.title}",
            "",
            f"{primary.snippet}",
        ]

        # If there are additional supporting items, include structured bullet points
        if len(citations) > 1:
            paragraphs.append("\n**Supporting Knowledge Excerpts:**")
            for idx, c in enumerate(citations[1:], 2):
                src_label = f"**{c.title}**"
                if c.source_name:
                    src_label += f" ({c.source_name})"
                paragraphs.append(f"- {src_label}: {c.snippet}")

        paragraphs.append("\n*(Answer directly retrieved from verified IKSHOVIA repository — 0 AI tokens consumed)*")
        return "\n".join(paragraphs)

    def _build_provider_fallback_response(
        self,
        clean_message: str,
        confidence: KnowledgeConfidence,
        knowledge_meta: KnowledgeResultMetadata,
        citations: List[SourceCitation],
        error_msg: str,
    ) -> TutorResponse:
        """
        Constructs a safe, non-crashing response when the AI provider fails,
        is rate limited, or quota is exceeded.
        """
        if citations and confidence != KnowledgeConfidence.NONE:
            answer = (
                f"### Knowledge-Backed Reference (AI Synthesis Unavailable)\n\n"
                f"*{error_msg}*\n\n"
                f"**Retrieved IKSHOVIA Context:**\n\n"
                + "\n\n".join([f"- **{c.title}**: {c.snippet}" for c in citations[:3]])
            )
        else:
            answer = (
                f"IKSHOVIA Tutor is currently operating in offline/knowledge-only mode. "
                f"No matching verified records were found for '{clean_message[:60]}', and AI synthesis is temporarily unavailable ({error_msg}). "
                f"Please refine your query or check back shortly."
            )

        return TutorResponse(
            success=True,
            answer=answer,
            confidence=confidence.value,
            knowledge=knowledge_meta,
            ai=AIResultMetadata(
                used=False,
                provider=None,
                model=None,
                usage=None,
                error=error_msg,
            ),
        )
