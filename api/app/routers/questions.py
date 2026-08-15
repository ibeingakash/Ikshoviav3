import math
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import EntityNotFoundError, InvalidParameterError
from app.core.logging import logger
from app.database import get_db
from app.models.question import DataQuestion
from app.models.resource import Resource
from app.schemas.common import PaginatedMeta, PaginatedResponse
from app.schemas.question import (
    BulkQuestionCreate,
    DataQuestionCreate,
    DataQuestionResponse,
    DataQuestionUpdate,
)

router = APIRouter(prefix="/questions", tags=["Data Questions & PYQs"])


@router.get(
    "",
    response_model=PaginatedResponse[DataQuestionResponse],
    summary="List & Filter Exam Questions / PYQs",
    description="Lists ingested questions with multi-criteria filtering by exam, year, subject, paper, question type, difficulty, and keyword search.",
)
async def list_questions(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    exam: Optional[str] = Query(default=None, description="Filter by exam (e.g. UPSC_CSE, STATE_PCS)"),
    year: Optional[int] = Query(default=None, description="Filter by year (e.g. 2024)"),
    paper: Optional[str] = Query(default=None, description="Filter by paper (e.g. GS1, GS2, CSAT)"),
    subject: Optional[str] = Query(default=None, description="Filter by subject (e.g. POLITY, ECONOMY)"),
    question_type: Optional[str] = Query(default=None, description="Filter by type (MCQ, MAINS_SUBJECTIVE)"),
    difficulty: Optional[str] = Query(default=None, description="Filter by difficulty (EASY, MEDIUM, HARD)"),
    is_pyq: Optional[bool] = Query(default=None, description="Filter by PYQ status"),
    search: Optional[str] = Query(default=None, description="Keyword search in question text or explanation"),
    db: AsyncSession = Depends(get_db),
):
    """Lists questions with rich filtering."""
    base_conditions = []
    if exam:
        base_conditions.append(DataQuestion.exam == exam.upper().strip())
    if year:
        base_conditions.append(DataQuestion.year == year)
    if paper:
        base_conditions.append(DataQuestion.paper == paper.upper().strip())
    if subject:
        base_conditions.append(DataQuestion.subject == subject.upper().strip())
    if question_type:
        base_conditions.append(DataQuestion.question_type == question_type.upper().strip())
    if difficulty:
        base_conditions.append(DataQuestion.difficulty == difficulty.upper().strip())
    if is_pyq is not None:
        base_conditions.append(DataQuestion.is_pyq == is_pyq)
    if search:
        search_pattern = f"%{search.strip()}%"
        base_conditions.append(
            or_(
                DataQuestion.question_text.ilike(search_pattern),
                DataQuestion.explanation.ilike(search_pattern),
                DataQuestion.topic.ilike(search_pattern),
            )
        )

    count_query = select(func.count(DataQuestion.id))
    if base_conditions:
        count_query = count_query.where(*base_conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar_one() or 0

    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    data_query = select(DataQuestion).order_by(DataQuestion.year.desc().nullslast(), DataQuestion.created_at.desc()).offset(offset).limit(page_size)
    if base_conditions:
        data_query = data_query.where(*base_conditions)

    data_result = await db.execute(data_query)
    items = data_result.scalars().all()

    return PaginatedResponse(
        success=True,
        data=items,
        pagination=PaginatedMeta(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        ),
    )


@router.post(
    "",
    response_model=DataQuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Single Question / PYQ",
    description="Registers an ingested question with verification of parent resource if provided.",
)
async def create_question(
    payload: DataQuestionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Creates a new question record."""
    if payload.resource_id:
        res_query = select(Resource).where(Resource.id == payload.resource_id)
        res_result = await db.execute(res_query)
        if not res_result.scalar_one_or_none():
            raise EntityNotFoundError(entity_name="Resource", identifier=payload.resource_id)

    new_q = DataQuestion(
        resource_id=payload.resource_id,
        exam=payload.exam.upper().strip(),
        year=payload.year,
        paper=payload.paper.upper().strip(),
        subject=payload.subject.upper().strip(),
        topic=payload.topic.strip() if payload.topic else None,
        question_type=payload.question_type.upper().strip(),
        question_text=payload.question_text.strip(),
        options=payload.options,
        correct_answer=payload.correct_answer.strip(),
        explanation=payload.explanation.strip(),
        difficulty=payload.difficulty.upper().strip(),
        marks=payload.marks,
        negative_marks=payload.negative_marks,
        tags=payload.tags,
        is_pyq=payload.is_pyq,
        is_verified=payload.is_verified,
    )

    db.add(new_q)
    await db.commit()
    await db.refresh(new_q)
    logger.info(f"Ingested question id={new_q.id} exam={new_q.exam} year={new_q.year}")
    return new_q


@router.post(
    "/bulk",
    response_model=List[DataQuestionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Bulk Ingest Questions",
    description="Batch creates multiple questions in a single atomic transaction.",
)
async def bulk_create_questions(
    payload: BulkQuestionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Bulk imports questions."""
    if not payload.questions:
        raise InvalidParameterError("Payload contains empty questions list.")

    created_questions = []
    for q_data in payload.questions:
        new_q = DataQuestion(
            resource_id=q_data.resource_id,
            exam=q_data.exam.upper().strip(),
            year=q_data.year,
            paper=q_data.paper.upper().strip(),
            subject=q_data.subject.upper().strip(),
            topic=q_data.topic.strip() if q_data.topic else None,
            question_type=q_data.question_type.upper().strip(),
            question_text=q_data.question_text.strip(),
            options=q_data.options,
            correct_answer=q_data.correct_answer.strip(),
            explanation=q_data.explanation.strip(),
            difficulty=q_data.difficulty.upper().strip(),
            marks=q_data.marks,
            negative_marks=q_data.negative_marks,
            tags=q_data.tags,
            is_pyq=q_data.is_pyq,
            is_verified=q_data.is_verified,
        )
        db.add(new_q)
        created_questions.append(new_q)

    await db.commit()
    for q in created_questions:
        await db.refresh(q)

    logger.info(f"Bulk ingested {len(created_questions)} questions")
    return created_questions


@router.get(
    "/{question_id}",
    response_model=DataQuestionResponse,
    summary="Get Question by ID",
    description="Retrieves a single question by its unique identifier.",
)
async def get_question(
    question_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetches question by ID."""
    query = select(DataQuestion).where(DataQuestion.id == question_id)
    result = await db.execute(query)
    question = result.scalar_one_or_none()
    if not question:
        raise EntityNotFoundError(entity_name="Question", identifier=question_id)
    return question
