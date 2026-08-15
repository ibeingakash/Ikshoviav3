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
from app.models.source import Source
from app.schemas.common import APIResponse, PaginatedMeta, PaginatedResponse
from app.schemas.source import SourceCreate, SourceResponse

router = APIRouter(prefix="/sources", tags=["Data Sources"])


@router.get(
    "",
    response_model=List[SourceResponse],
    summary="List Ingestion Sources",
    description="Retrieves a list of configured public and allowed data sources (Government Portals, PIB, Gazettes, etc.) with optional filtering by active status or source type.",
)
async def list_sources(
    source_type: Optional[str] = Query(default=None, description="Filter by source type (e.g. GOVERNMENT, NEWS, GAZETTE)"),
    is_active: Optional[bool] = Query(default=None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
):
    """List all sources with optional filtering."""
    query = select(Source).order_by(Source.created_at.desc())
    
    if source_type is not None:
        query = query.where(Source.source_type == source_type.upper().strip())
    if is_active is not None:
        query = query.where(Source.is_active == is_active)
        
    result = await db.execute(query)
    sources = result.scalars().all()
    return sources


@router.post(
    "",
    response_model=SourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Data Source",
    description="Registers a new allowed public origin or repository with a unique slug and base URL.",
)
async def create_source(
    payload: SourceCreate,
    db: AsyncSession = Depends(get_db),
):
    """Registers a new data source."""
    # Check if slug already exists
    existing_query = select(Source).where(Source.slug == payload.slug)
    existing_result = await db.execute(existing_query)
    if existing_result.scalar_one_or_none():
        raise DuplicateEntityError(entity_name="Source", field="slug", value=payload.slug)

    new_source = Source(
        name=payload.name.strip(),
        slug=payload.slug.strip().lower(),
        base_url=str(payload.base_url).strip(),
        source_type=payload.source_type.upper().strip(),
        is_active=payload.is_active,
    )

    try:
        db.add(new_source)
        await db.commit()
        await db.refresh(new_source)
        logger.info(f"Created new data source id={new_source.id} slug={new_source.slug}")
        return new_source
    except IntegrityError as exc:
        await db.rollback()
        raise DuplicateEntityError(entity_name="Source", field="slug", value=payload.slug)


@router.get(
    "/{source_id}",
    response_model=SourceResponse,
    summary="Get Data Source by ID",
    description="Retrieves full metadata and status for a specific data source by its unique ID.",
)
async def get_source(
    source_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetch single source by ID."""
    query = select(Source).where(Source.id == source_id)
    result = await db.execute(query)
    source = result.scalar_one_or_none()
    
    if not source:
        raise EntityNotFoundError(entity_name="Source", identifier=source_id)
        
    return source
