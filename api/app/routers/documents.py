import hashlib
import math
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import EntityNotFoundError, InvalidParameterError
from app.core.logging import logger
from app.database import get_db
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.resource import Resource
from app.schemas.chunk import ChunkResponse
from app.schemas.common import PaginatedMeta, PaginatedResponse
from app.schemas.document import DocumentChunkRequest, DocumentCreate, DocumentResponse, DocumentUpdate

router = APIRouter(prefix="/documents", tags=["Data Documents"])


@router.get(
    "",
    response_model=PaginatedResponse[DocumentResponse],
    summary="List Extracted Documents",
    description="Lists extracted and parsed documents with optional filtering by resource ID and extraction status.",
)
async def list_documents(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    resource_id: Optional[str] = Query(default=None, description="Filter documents by parent resource ID"),
    extraction_status: Optional[str] = Query(default=None, description="Filter by status (PENDING, EXTRACTED, FAILED)"),
    db: AsyncSession = Depends(get_db),
):
    """List documents with pagination and filtering."""
    base_conditions = []
    if resource_id:
        base_conditions.append(Document.resource_id == resource_id)
    if extraction_status:
        base_conditions.append(Document.extraction_status == extraction_status.upper().strip())

    count_query = select(func.count(Document.id))
    if base_conditions:
        count_query = count_query.where(*base_conditions)
    total_result = await db.execute(count_query)
    total = total_result.scalar_one() or 0

    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size

    data_query = select(Document).order_by(Document.created_at.desc()).offset(offset).limit(page_size)
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
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Extracted Document",
    description="Registers an extracted text body or parsed document linked to an existing resource.",
)
async def create_document(
    payload: DocumentCreate,
    db: AsyncSession = Depends(get_db),
):
    """Creates a document record."""
    # Verify parent resource exists
    res_query = select(Resource).where(Resource.id == payload.resource_id)
    res_result = await db.execute(res_query)
    resource = res_result.scalar_one_or_none()
    if not resource:
        raise EntityNotFoundError(entity_name="Resource", identifier=payload.resource_id)

    raw_text = payload.raw_text or ""
    clean_text = payload.clean_text or raw_text.strip()
    file_size = payload.file_size_bytes or len(raw_text.encode("utf-8"))

    new_doc = Document(
        resource_id=payload.resource_id,
        raw_text=raw_text if raw_text else None,
        clean_text=clean_text if clean_text else None,
        mime_type=payload.mime_type,
        file_size_bytes=file_size,
        page_count=payload.page_count,
        language=payload.language.lower().strip(),
        meta_info=payload.meta_info,
        extraction_status=payload.extraction_status.upper().strip(),
        extraction_method=payload.extraction_method.upper().strip(),
        error_message=payload.error_message,
    )

    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    logger.info(f"Created document id={new_doc.id} for resource_id={new_doc.resource_id}")
    return new_doc


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get Document by ID",
    description="Retrieves a single extracted document by its unique ID.",
)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetches document by ID."""
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    if not doc:
        raise EntityNotFoundError(entity_name="Document", identifier=document_id)
    return doc


@router.post(
    "/{document_id}/chunk",
    response_model=List[ChunkResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Auto-Chunk Document Text",
    description="Splits the document clean text into overlapping chunks and stores them in data_chunks.",
)
async def chunk_document(
    document_id: str,
    payload: DocumentChunkRequest = DocumentChunkRequest(),
    db: AsyncSession = Depends(get_db),
):
    """Splits document text into manageable chunks and stores them."""
    query = select(Document).where(Document.id == document_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    if not doc:
        raise EntityNotFoundError(entity_name="Document", identifier=document_id)

    text_to_chunk = doc.clean_text or doc.raw_text
    if not text_to_chunk or not text_to_chunk.strip():
        raise InvalidParameterError("Document contains no text to chunk.")

    # Simple sliding window chunker
    words = text_to_chunk.split()
    chunk_size = payload.chunk_size
    overlap = payload.chunk_overlap
    step = max(1, chunk_size - overlap)

    chunks_created = []
    chunk_idx = 0

    for i in range(0, len(words), step):
        chunk_words = words[i:i + chunk_size]
        if not chunk_words:
            break
        chunk_text = " ".join(chunk_words)
        chunk_hash = hashlib.sha256(chunk_text.encode("utf-8")).hexdigest()
        
        new_chunk = Chunk(
            document_id=doc.id,
            chunk_index=chunk_idx,
            content=chunk_text,
            token_count=len(chunk_words),
            character_count=len(chunk_text),
            chunk_hash=chunk_hash,
            metadata_json={"word_start": i, "word_end": i + len(chunk_words)},
        )
        db.add(new_chunk)
        chunks_created.append(new_chunk)
        chunk_idx += 1

    await db.commit()
    for chk in chunks_created:
        await db.refresh(chk)

    logger.info(f"Chunked document id={doc.id} into {len(chunks_created)} chunks")
    return chunks_created
