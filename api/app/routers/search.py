from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import InvalidParameterError
from app.core.logging import logger
from app.database import get_db
from app.search.schemas import SearchQueryFilters, SearchResponse
from app.search.service import KnowledgeSearchService

router = APIRouter(prefix="/search", tags=["Knowledge Search & Retrieval"])


@router.get(
    "",
    response_model=SearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Knowledge Base Search",
    description="Deterministic lexical and full-text search across IKSHOVIA questions, documents, chunks, and tags.",
)
async def search_knowledge_base(
    q: str = Query(..., min_length=1, description="Search query string (required, non-empty)"),
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Results per page (max 100)"),
    exam: Optional[str] = Query(default=None, description="Filter questions by exam code (e.g. UPSC_CSE, STATE_PCS)"),
    year: Optional[int] = Query(default=None, description="Filter questions by exam year (e.g. 2024)"),
    paper: Optional[str] = Query(default=None, description="Filter questions by paper (e.g. GS1, GS2, CSAT)"),
    subject: Optional[str] = Query(default=None, description="Filter questions by subject (e.g. POLITY, ECONOMY)"),
    topic: Optional[str] = Query(default=None, description="Filter questions by topic keyword"),
    question_type: Optional[str] = Query(default=None, description="Filter questions by type (e.g. MCQ, MAINS_SUBJECTIVE)"),
    difficulty: Optional[str] = Query(default=None, description="Filter questions by difficulty (EASY, MEDIUM, HARD)"),
    is_pyq: Optional[bool] = Query(default=None, description="Filter questions by PYQ status (true/false)"),
    source_id: Optional[str] = Query(default=None, description="Filter by origin data source ID"),
    resource_id: Optional[str] = Query(default=None, description="Filter by parent resource ID"),
    content_type: Optional[str] = Query(default=None, description="Filter by entity type (question, document, chunk, tag)"),
    type: Optional[str] = Query(default=None, description="Alias for content_type"),
    tag: Optional[str] = Query(default=None, description="Filter by tag slug or name"),
    date_from: Optional[datetime] = Query(default=None, description="Filter resources/documents published after this timestamp"),
    date_to: Optional[datetime] = Query(default=None, description="Filter resources/documents published before this timestamp"),
    db: AsyncSession = Depends(get_db),
) -> SearchResponse:
    """Executes a validated search across the knowledge repository."""
    # Reject empty or whitespace-only queries cleanly
    clean_q = q.strip() if q else ""
    if not clean_q:
        raise InvalidParameterError(
            message="Search query string 'q' cannot be empty or whitespace only",
            details={"field": "q"},
        )

    resolved_content_type = content_type or type

    filters = SearchQueryFilters(
        exam=exam,
        year=year,
        paper=paper,
        subject=subject,
        topic=topic,
        question_type=question_type,
        difficulty=difficulty,
        is_pyq=is_pyq,
        source_id=source_id,
        resource_id=resource_id,
        content_type=resolved_content_type,
        tag=tag,
        date_from=date_from,
        date_to=date_to,
    )

    return await KnowledgeSearchService.search(
        db=db,
        query=clean_q,
        filters=filters,
        page=page,
        page_size=page_size,
    )
