from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import DuplicateEntityError, EntityNotFoundError
from app.core.logging import logger
from app.database import get_db
from app.models.tag import DataTag
from app.schemas.tag import TagCreate, TagResponse

router = APIRouter(prefix="/tags", tags=["Taxonomy & Tags"])


@router.get(
    "",
    response_model=List[TagResponse],
    summary="List Taxonomy Tags",
    description="Retrieves all taxonomy tags with optional filtering by category.",
)
async def list_tags(
    category: Optional[str] = Query(default=None, description="Filter tags by category (e.g. SUBJECT, TOPIC, SYLLABUS_SECTION)"),
    db: AsyncSession = Depends(get_db),
):
    """Lists taxonomy tags."""
    query = select(DataTag).order_by(DataTag.category, DataTag.name)
    if category:
        query = query.where(DataTag.category == category.upper().strip())
    result = await db.execute(query)
    tags = result.scalars().all()
    return tags


@router.post(
    "",
    response_model=TagResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Taxonomy Tag",
    description="Creates a new taxonomy tag with unique slug enforcement.",
)
async def create_tag(
    payload: TagCreate,
    db: AsyncSession = Depends(get_db),
):
    """Creates a new taxonomy tag."""
    existing_query = select(DataTag).where(DataTag.slug == payload.slug)
    existing_res = await db.execute(existing_query)
    if existing_res.scalar_one_or_none():
        raise DuplicateEntityError(entity_name="Tag", field="slug", value=payload.slug)

    new_tag = DataTag(
        name=payload.name.strip(),
        slug=payload.slug.strip().lower(),
        category=payload.category.upper().strip(),
        description=payload.description.strip(),
    )

    try:
        db.add(new_tag)
        await db.commit()
        await db.refresh(new_tag)
        return new_tag
    except IntegrityError:
        await db.rollback()
        raise DuplicateEntityError(entity_name="Tag", field="slug", value=payload.slug)


@router.get(
    "/{tag_id}",
    response_model=TagResponse,
    summary="Get Tag by ID",
    description="Retrieves a single taxonomy tag by ID.",
)
async def get_tag(
    tag_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetches tag by ID."""
    query = select(DataTag).where(DataTag.id == tag_id)
    result = await db.execute(query)
    tag = result.scalar_one_or_none()
    if not tag:
        raise EntityNotFoundError(entity_name="Tag", identifier=tag_id)
    return tag
