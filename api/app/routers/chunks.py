import hashlib
import math
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import EntityNotFoundError, InvalidParameterError
from app.core.logging import logger
from app.database import get_db
from app.models.chunk import Chunk
from app.models.document import Document
from app.schemas.chunk import BatchChunkCreate, ChunkCreate, ChunkResponse
from app.schemas.common import PaginatedMeta, PaginatedResponse

router = APIRouter(prefix="/chunks", tags=["Data Chunks"])


@router.get(
    "",
    response_model=PaginatedResponse[ChunkResponse],
    summary="List Document Chunks",
    description="Retrieves chunks with optional filtering by document ID and text search.",
)
async def list_chunks(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    document_id: Optional[str] = Query(default=None, description="Filter chunks belonging to a document ID"),
    search: Optional[str] = Query(default=None, description="Keyword search across chunk text"),
    db: AsyncSession = Depends(get_db),
):
    """Lists chunks with pagination and keyword filtering."""
    base_conditions = []
    if document_id:
        base_conditions.append(Chunk.document_id == document_id)
    if search:
        base_conditions.append(Chunk.content.ilike(f"%{search.strip()}%"))

    count_query = select(func.count(Chunk.id))
    if base_conditions:
        count_query = count_query.where(*base_conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar_one() or 0

    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    data_query = select(Chunk).order_by(Chunk.document_id, Chunk.chunk_index).offset(offset).limit(page_size)
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
    response_model=ChunkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Single Chunk",
    description="Creates a manual chunk linked to a document.",
)
async def create_chunk(
    payload: ChunkCreate,
    db: AsyncSession = Depends(get_db),
):
    """Creates a single chunk."""
    doc_query = select(Document).where(Document.id == payload.document_id)
    doc_res = await db.execute(doc_query)
    if not doc_res.scalar_one_or_none():
        raise EntityNotFoundError(entity_name="Document", identifier=payload.document_id)

    chunk_hash = payload.chunk_hash or hashlib.sha256(payload.content.encode("utf-8")).hexdigest()
    token_count = payload.token_count or len(payload.content.split())
    char_count = payload.character_count or len(payload.content)

    new_chunk = Chunk(
        document_id=payload.document_id,
        chunk_index=payload.chunk_index,
        content=payload.content,
        token_count=token_count,
        character_count=char_count,
        heading=payload.heading,
        section=payload.section,
        chunk_hash=chunk_hash,
        metadata_json=payload.metadata_json,
    )

    db.add(new_chunk)
    await db.commit()
    await db.refresh(new_chunk)
    return new_chunk


@router.get(
    "/{chunk_id}",
    response_model=ChunkResponse,
    summary="Get Chunk by ID",
    description="Retrieves a single chunk by its ID.",
)
async def get_chunk(
    chunk_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetches chunk by ID."""
    query = select(Chunk).where(Chunk.id == chunk_id)
    result = await db.execute(query)
    chunk = result.scalar_one_or_none()
    if not chunk:
        raise EntityNotFoundError(entity_name="Chunk", identifier=chunk_id)
    return chunk
