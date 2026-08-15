from datetime import datetime, timezone
import math
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import EntityNotFoundError
from app.core.logging import logger
from app.database import get_db
from app.models.job import IngestionJob
from app.schemas.common import PaginatedMeta, PaginatedResponse
from app.schemas.job import JobCreate, JobResponse, JobUpdate

router = APIRouter(prefix="/jobs", tags=["Ingestion Jobs"])


@router.get(
    "",
    response_model=PaginatedResponse[JobResponse],
    summary="List Ingestion Jobs",
    description="Retrieves a paginated list of background or scheduled ingestion and extraction jobs.",
)
async def list_jobs(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    status_filter: Optional[str] = Query(default=None, alias="status", description="Filter by job status (PENDING, RUNNING, COMPLETED, FAILED)"),
    job_type: Optional[str] = Query(default=None, description="Filter by job type"),
    db: AsyncSession = Depends(get_db),
):
    """Lists jobs with pagination and status filtering."""
    base_conditions = []
    if status_filter:
        base_conditions.append(IngestionJob.status == status_filter.upper().strip())
    if job_type:
        base_conditions.append(IngestionJob.job_type == job_type.upper().strip())

    count_query = select(func.count(IngestionJob.id))
    if base_conditions:
        count_query = count_query.where(*base_conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar_one() or 0

    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    data_query = select(IngestionJob).order_by(IngestionJob.created_at.desc()).offset(offset).limit(page_size)
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
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enqueue Ingestion Job",
    description="Submits a new ingestion or processing task to the queue.",
)
async def create_job(
    payload: JobCreate,
    db: AsyncSession = Depends(get_db),
):
    """Enqueues a new job."""
    new_job = IngestionJob(
        source_id=payload.source_id,
        resource_id=payload.resource_id,
        job_type=payload.job_type.upper().strip(),
        status="PENDING",
        progress_percentage=0,
        items_processed=0,
        total_items=0,
        meta_info=payload.meta_info,
    )
    db.add(new_job)
    await db.commit()
    await db.refresh(new_job)
    logger.info(f"Enqueued job id={new_job.id} type={new_job.job_type}")
    return new_job


@router.get(
    "/{job_id}",
    response_model=JobResponse,
    summary="Get Job Status",
    description="Fetches current status, metrics, and progress of a specific job.",
)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetches job by ID."""
    query = select(IngestionJob).where(IngestionJob.id == job_id)
    result = await db.execute(query)
    job = result.scalar_one_or_none()
    if not job:
        raise EntityNotFoundError(entity_name="IngestionJob", identifier=job_id)
    return job


@router.patch(
    "/{job_id}",
    response_model=JobResponse,
    summary="Update Job Progress/Status",
    description="Updates execution status, progress percentage, or logs for an active job.",
)
async def update_job(
    job_id: str,
    payload: JobUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Updates job status and progress metrics."""
    query = select(IngestionJob).where(IngestionJob.id == job_id)
    result = await db.execute(query)
    job = result.scalar_one_or_none()
    if not job:
        raise EntityNotFoundError(entity_name="IngestionJob", identifier=job_id)

    if payload.status:
        job.status = payload.status.upper().strip()
        if job.status == "RUNNING" and not job.started_at:
            job.started_at = datetime.now(timezone.utc)
        elif job.status in ("COMPLETED", "FAILED", "CANCELLED") and not job.completed_at:
            job.completed_at = datetime.now(timezone.utc)

    if payload.progress_percentage is not None:
        job.progress_percentage = payload.progress_percentage
    if payload.items_processed is not None:
        job.items_processed = payload.items_processed
    if payload.total_items is not None:
        job.total_items = payload.total_items
    if payload.error_log is not None:
        job.error_log = payload.error_log
    if payload.meta_info is not None:
        job.meta_info = payload.meta_info

    await db.commit()
    await db.refresh(job)
    return job
