import math
from typing import Any, Dict, List, Optional
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import InvalidParameterError
from app.core.logging import logger
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.question import DataQuestion
from app.models.resource import Resource
from app.models.tag import DataTag
from app.search.ranking import calculate_relevance_score, extract_snippet, tokenize
from app.search.schemas import (
    SearchPagination,
    SearchQueryFilters,
    SearchResponse,
    SearchResultItem,
)


class KnowledgeSearchService:
    """
    Dedicated provider-independent retrieval service searching IKSHOVIA's
    persisted knowledge base (Questions, Documents, Chunks, Tags) without AI or external dependencies.
    """

    @staticmethod
    def _build_token_conditions(columns: List[Any], query: str) -> List[Any]:
        """Builds SQL OR conditions for exact query and significant tokens."""
        clean_q = query.strip()
        conditions = [col.ilike(f"%{clean_q}%") for col in columns]

        # Also search individual non-stopword tokens for recall
        tokens = tokenize(clean_q, remove_stopwords=True)
        for token in tokens:
            if len(token) >= 3 and token.lower() != clean_q.lower():
                conditions.extend([col.ilike(f"%{token}%") for col in columns])

        return conditions

    @classmethod
    async def search(
        cls,
        db: AsyncSession,
        query: str,
        filters: SearchQueryFilters,
        page: int = 1,
        page_size: int = 20,
    ) -> SearchResponse:
        """
        Executes unified deterministic search across IKSHOVIA knowledge assets.
        """
        clean_query = query.strip() if query else ""
        if not clean_query:
            raise InvalidParameterError(
                message="Search query string 'q' cannot be empty or whitespace only",
                details={"field": "q"},
            )

        # Enforce safe pagination bounds
        safe_page = max(1, page)
        safe_page_size = max(1, min(100, page_size))

        target_type = (filters.content_type or "").lower().strip()
        include_questions = not target_type or target_type in ("question", "questions")
        include_documents = not target_type or target_type in ("document", "documents")
        include_chunks = not target_type or target_type in ("chunk", "chunks")
        include_tags = not target_type or target_type in ("tag", "tags")

        # If question-specific filters are active, narrow search to questions only unless explicitly asked
        question_specific_active = any([
            filters.exam,
            filters.year is not None,
            filters.paper,
            filters.subject,
            filters.topic,
            filters.question_type,
            filters.difficulty,
            filters.is_pyq is not None,
        ])
        if question_specific_active and not target_type:
            include_documents = False
            include_chunks = False
            include_tags = False

        candidate_items: List[SearchResultItem] = []

        # -------------------------------------------------------------
        # 1. Search Questions
        # -------------------------------------------------------------
        if include_questions:
            q_items = await cls._search_questions(db, clean_query, filters)
            candidate_items.extend(q_items)

        # -------------------------------------------------------------
        # 2. Search Documents
        # -------------------------------------------------------------
        if include_documents:
            d_items = await cls._search_documents(db, clean_query, filters)
            candidate_items.extend(d_items)

        # -------------------------------------------------------------
        # 3. Search Chunks
        # -------------------------------------------------------------
        if include_chunks:
            c_items = await cls._search_chunks(db, clean_query, filters)
            candidate_items.extend(c_items)

        # -------------------------------------------------------------
        # 4. Search Tags
        # -------------------------------------------------------------
        if include_tags:
            t_items = await cls._search_tags(db, clean_query, filters)
            candidate_items.extend(t_items)

        # -------------------------------------------------------------
        # 5. Deterministic Global Ranking & Tie-Breaking
        # -------------------------------------------------------------
        # Sort by: 1. score DESC, 2. id ASC (deterministic tie-breaker)
        candidate_items.sort(key=lambda item: (-item.score, item.id))

        total_matches = len(candidate_items)
        total_pages = math.ceil(total_matches / safe_page_size) if total_matches > 0 else 0

        # Pagination slice
        offset = (safe_page - 1) * safe_page_size
        paginated_results = candidate_items[offset : offset + safe_page_size]

        pagination = SearchPagination(
            page=safe_page,
            page_size=safe_page_size,
            total=total_matches,
            total_pages=total_pages,
            has_next=safe_page < total_pages,
            has_previous=safe_page > 1 and total_pages > 0,
        )

        return SearchResponse(
            success=True,
            query=clean_query,
            results=paginated_results,
            pagination=pagination,
        )

    @classmethod
    async def _search_questions(
        cls,
        db: AsyncSession,
        query: str,
        filters: SearchQueryFilters,
    ) -> List[SearchResultItem]:
        """Searches questions table and ranks matches."""
        stmt = select(DataQuestion)

        # Build search text condition
        text_cols = [
            DataQuestion.question_text,
            DataQuestion.explanation,
            DataQuestion.topic,
            DataQuestion.subject,
        ]
        stmt = stmt.where(or_(*cls._build_token_conditions(text_cols, query)))

        # Apply schema filters
        if filters.exam:
            clean_exam = filters.exam.upper().strip()
            exam_variants = {clean_exam, clean_exam.replace(" ", "_"), clean_exam.replace("_", " ")}
            stmt = stmt.where(DataQuestion.exam.in_(exam_variants))
        if filters.year is not None:
            stmt = stmt.where(DataQuestion.year == filters.year)
        if filters.paper:
            clean_paper = filters.paper.upper().strip()
            paper_variants = {clean_paper, clean_paper.replace(" ", "_"), clean_paper.replace("_", " ")}
            stmt = stmt.where(DataQuestion.paper.in_(paper_variants))
        if filters.subject:
            clean_subj = filters.subject.upper().strip()
            subj_variants = {clean_subj, clean_subj.replace(" ", "_"), clean_subj.replace("_", " ")}
            stmt = stmt.where(or_(DataQuestion.subject.in_(subj_variants), DataQuestion.subject.ilike(f"%{filters.subject.strip()}%")))
        if filters.topic:
            stmt = stmt.where(DataQuestion.topic.ilike(f"%{filters.topic.strip()}%"))
        if filters.question_type:
            stmt = stmt.where(DataQuestion.question_type == filters.question_type.upper().strip())
        if filters.difficulty:
            stmt = stmt.where(DataQuestion.difficulty == filters.difficulty.upper().strip())
        if filters.is_pyq is not None:
            stmt = stmt.where(DataQuestion.is_pyq == filters.is_pyq)
        if filters.resource_id:
            stmt = stmt.where(DataQuestion.resource_id == filters.resource_id)

        # Source ID filter requires joining Resource
        if filters.source_id:
            stmt = stmt.join(Resource, DataQuestion.resource_id == Resource.id).where(
                Resource.source_id == filters.source_id
            )

        if filters.date_from:
            stmt = stmt.where(DataQuestion.created_at >= filters.date_from)
        if filters.date_to:
            stmt = stmt.where(DataQuestion.created_at <= filters.date_to)

        # Limit candidate pool for safe memory and high performance
        stmt = stmt.limit(100)
        res = await db.execute(stmt)
        questions = res.scalars().all()

        results: List[SearchResultItem] = []
        for q in questions:
            title_text = q.question_text
            body_text = q.explanation or ""
            meta_text = f"{q.exam} {q.year or ''} {q.paper} {q.subject} {q.topic or ''}"

            score = calculate_relevance_score(
                query=query,
                title=title_text,
                body=body_text,
                meta_text=meta_text,
                entity_type="question",
            )

            # Generate safe, bounded snippet
            snippet = extract_snippet(q.question_text, query, max_length=320)

            results.append(
                SearchResultItem(
                    type="question",
                    id=q.id,
                    title=f"[{q.exam} {q.year or ''}] {q.subject}: {extract_snippet(q.question_text, query, max_length=90)}",
                    content=snippet,
                    resource_id=q.resource_id,
                    score=score,
                    metadata={
                        "exam": q.exam,
                        "year": q.year,
                        "paper": q.paper,
                        "subject": q.subject,
                        "topic": q.topic,
                        "question_type": q.question_type,
                        "difficulty": q.difficulty,
                        "is_pyq": q.is_pyq,
                        "marks": q.marks,
                        "tags": q.tags or [],
                    },
                )
            )

        return results

    @classmethod
    async def _search_documents(
        cls,
        db: AsyncSession,
        query: str,
        filters: SearchQueryFilters,
    ) -> List[SearchResultItem]:
        """Searches documents table joined with resources and ranks matches."""
        stmt = select(Document, Resource).join(Resource, Document.resource_id == Resource.id)

        text_cols = [
            Document.clean_text,
            Document.raw_text,
            Resource.title,
            Resource.description,
        ]
        stmt = stmt.where(or_(*cls._build_token_conditions(text_cols, query)))

        if filters.resource_id:
            stmt = stmt.where(Document.resource_id == filters.resource_id)
        if filters.source_id:
            stmt = stmt.where(Resource.source_id == filters.source_id)
        if filters.date_from:
            stmt = stmt.where(
                or_(
                    Resource.published_at >= filters.date_from,
                    Document.created_at >= filters.date_from,
                )
            )
        if filters.date_to:
            stmt = stmt.where(
                or_(
                    Resource.published_at <= filters.date_to,
                    Document.created_at <= filters.date_to,
                )
            )

        stmt = stmt.limit(100)
        res = await db.execute(stmt)
        rows = res.all()

        results: List[SearchResultItem] = []
        for doc, res_item in rows:
            title_text = res_item.title or f"Document {doc.id}"
            body_text = doc.clean_text or doc.raw_text or res_item.description or ""
            meta_text = f"{res_item.resource_type} {res_item.url} {doc.mime_type}"

            score = calculate_relevance_score(
                query=query,
                title=title_text,
                body=body_text,
                meta_text=meta_text,
                entity_type="document",
            )

            snippet = extract_snippet(body_text, query, max_length=320)

            results.append(
                SearchResultItem(
                    type="document",
                    id=doc.id,
                    title=title_text,
                    content=snippet,
                    source_id=res_item.source_id,
                    resource_id=doc.resource_id,
                    document_id=doc.id,
                    score=score,
                    metadata={
                        "mime_type": doc.mime_type,
                        "language": doc.language,
                        "page_count": doc.page_count,
                        "extraction_status": doc.extraction_status,
                        "url": res_item.url,
                        "resource_type": res_item.resource_type,
                        "published_at": res_item.published_at.isoformat() if res_item.published_at else None,
                    },
                )
            )

        return results

    @classmethod
    async def _search_chunks(
        cls,
        db: AsyncSession,
        query: str,
        filters: SearchQueryFilters,
    ) -> List[SearchResultItem]:
        """Searches granular chunks table and ranks matches."""
        stmt = (
            select(Chunk, Document, Resource)
            .join(Document, Chunk.document_id == Document.id)
            .join(Resource, Document.resource_id == Resource.id)
        )

        text_cols = [
            Chunk.content,
            Chunk.heading,
            Chunk.section,
        ]
        stmt = stmt.where(or_(*cls._build_token_conditions(text_cols, query)))

        if filters.resource_id:
            stmt = stmt.where(Document.resource_id == filters.resource_id)
        if filters.source_id:
            stmt = stmt.where(Resource.source_id == filters.source_id)

        stmt = stmt.limit(100)
        res = await db.execute(stmt)
        rows = res.all()

        results: List[SearchResultItem] = []
        for chunk, doc, res_item in rows:
            title_text = chunk.heading or f"{res_item.title} (Part #{chunk.chunk_index + 1})"
            body_text = chunk.content
            meta_text = f"{chunk.section or ''} {res_item.title}"

            score = calculate_relevance_score(
                query=query,
                title=title_text,
                body=body_text,
                meta_text=meta_text,
                entity_type="chunk",
            )

            snippet = extract_snippet(body_text, query, max_length=320)

            results.append(
                SearchResultItem(
                    type="chunk",
                    id=chunk.id,
                    title=title_text,
                    content=snippet,
                    source_id=res_item.source_id,
                    resource_id=doc.resource_id,
                    document_id=chunk.document_id,
                    score=score,
                    metadata={
                        "chunk_index": chunk.chunk_index,
                        "heading": chunk.heading,
                        "section": chunk.section,
                        "token_count": chunk.token_count,
                        "character_count": chunk.character_count,
                        "document_id": chunk.document_id,
                    },
                )
            )

        return results

    @classmethod
    async def _search_tags(
        cls,
        db: AsyncSession,
        query: str,
        filters: SearchQueryFilters,
    ) -> List[SearchResultItem]:
        """Searches data tags taxonomy."""
        stmt = select(DataTag)

        text_cols = [
            DataTag.name,
            DataTag.slug,
            DataTag.description,
        ]
        stmt = stmt.where(or_(*cls._build_token_conditions(text_cols, query)))

        if filters.tag:
            stmt = stmt.where(
                or_(
                    DataTag.slug == filters.tag.strip(),
                    DataTag.name.ilike(f"%{filters.tag.strip()}%"),
                )
            )

        stmt = stmt.limit(50)
        res = await db.execute(stmt)
        tags = res.scalars().all()

        results: List[SearchResultItem] = []
        for tag in tags:
            title_text = tag.name
            body_text = tag.description or f"Tag category: {tag.category} (slug: {tag.slug})"
            meta_text = f"{tag.category} {tag.slug}"

            score = calculate_relevance_score(
                query=query,
                title=title_text,
                body=body_text,
                meta_text=meta_text,
                entity_type="tag",
            )

            snippet = extract_snippet(body_text, query, max_length=240)

            results.append(
                SearchResultItem(
                    type="tag",
                    id=tag.id,
                    title=tag.name,
                    content=snippet,
                    score=score,
                    metadata={
                        "slug": tag.slug,
                        "category": tag.category,
                    },
                )
            )

        return results
