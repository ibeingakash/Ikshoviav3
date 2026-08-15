import math
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import (
    DuplicateEntityError,
    EntityNotFoundError,
    InvalidParameterError,
)
from app.core.logging import logger
from app.database import get_db
from app.models.resource import Resource
from app.models.source import Source
from app.schemas.common import PaginatedMeta, PaginatedResponse
from app.schemas.resource import ResourceCreate, ResourceResponse

router = APIRouter(prefix="/resources", tags=["Data Resources"])


@router.get(
    "",
    response_model=PaginatedResponse[ResourceResponse],
    summary="List & Filter Ingested Resources",
    description="Returns a paginated list of ingested public/allowed resources (PDFs, Articles, Gazettes, Reports) with multi-criteria filtering by source, resource type, and processing status.",
)
async def list_resources(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page (max 100)"),
    source_id: Optional[str] = Query(default=None, description="Filter resources belonging to a specific Source ID"),
    resource_type: Optional[str] = Query(default=None, description="Filter by resource type (e.g. ARTICLE, PDF, GAZETTE, REPORT)"),
    status: Optional[str] = Query(default=None, description="Filter by ingestion/extraction status (e.g. DISCOVERED, PENDING_EXTRACTION, PROCESSED)"),
    db: AsyncSession = Depends(get_db),
):
    """List paginated resources with filtering."""
    # Build filter conditions
    base_conditions = []
    if source_id:
        base_conditions.append(Resource.source_id == source_id)
    if resource_type:
        base_conditions.append(Resource.resource_type == resource_type.upper().strip())
    if status:
        base_conditions.append(Resource.status == status.upper().strip())

    # Count total
    count_query = select(func.count(Resource.id))
    if base_conditions:
        count_query = count_query.where(*base_conditions)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar_one() or 0

    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    # Fetch page
    data_query = select(Resource).order_by(Resource.created_at.desc()).offset(offset).limit(page_size)
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
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest or Register New Resource",
    description="Registers an ingested public/allowed document or article. Enforces source existence and prevents duplicate resource URLs.",
)
async def create_resource(
    payload: ResourceCreate,
    db: AsyncSession = Depends(get_db),
):
    """Creates an ingested resource item."""
    # 1. Verify parent source exists
    source_query = select(Source).where(Source.id == payload.source_id)
    source_res = await db.execute(source_query)
    source = source_res.scalar_one_or_none()
    if not source:
        raise EntityNotFoundError(entity_name="Source", identifier=payload.source_id)

    # 2. Check duplicate URL
    url_query = select(Resource).where(Resource.url == payload.url)
    url_res = await db.execute(url_query)
    if url_res.scalar_one_or_none():
        raise DuplicateEntityError(entity_name="Resource", field="url", value=payload.url)

    content_hash = payload.get_content_hash()

    new_resource = Resource(
        source_id=payload.source_id,
        title=payload.title.strip(),
        url=str(payload.url).strip(),
        resource_type=payload.resource_type.upper().strip(),
        description=payload.description.strip() if payload.description else None,
        published_at=payload.published_at,
        content_hash=content_hash,
        status=payload.status.upper().strip(),
    )

    try:
        db.add(new_resource)
        await db.commit()
        await db.refresh(new_resource)
        logger.info(f"Ingested new resource id={new_resource.id} url={new_resource.url}")
        return new_resource
    except IntegrityError as exc:
        await db.rollback()
        raise DuplicateEntityError(entity_name="Resource", field="url", value=payload.url)


@router.get(
    "/{resource_id}",
    response_model=ResourceResponse,
    summary="Get Resource by ID",
    description="Retrieves complete metadata, parent source details, and extraction status for a single resource item.",
)
async def get_resource(
    resource_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetches a single resource by its unique identifier."""
    query = select(Resource).where(Resource.id == resource_id)
    result = await db.execute(query)
    resource = result.scalar_one_or_none()

    if not resource:
        raise EntityNotFoundError(entity_name="Resource", identifier=resource_id)

    return resource
