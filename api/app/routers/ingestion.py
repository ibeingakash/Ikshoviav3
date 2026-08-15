from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DataAPIException
from app.database import get_db
from app.ingestion.core.worker import IngestionWorker
from app.ingestion.fetchers.http_fetcher import HttpFetcher, SSRFValidationError
from app.schemas.common import APIResponse
from app.schemas.ingestion import IngestionRunData, IngestionRunRequest

router = APIRouter(prefix="/ingestion", tags=["Ingestion Pipeline"])


@router.post(
    "/run",
    response_model=APIResponse[IngestionRunData],
    status_code=status.HTTP_200_OK,
    summary="Run Ingestion Pipeline",
    description="""
    Executes the modular, provider-independent ingestion pipeline for a permitted public resource URL:
    1. Validates URL against SSRF and scheme restrictions.
    2. Resolves matching SourceAdapter.
    3. Initializes and tracks IngestionJob state (PENDING -> RUNNING -> COMPLETED/FAILED).
    4. Fetches, parses, normalizes, hashes, and persists Resource, Document, and Chunks.
    5. Returns unified execution metrics and identifiers.
    """,
)
async def run_ingestion(
    payload: IngestionRunRequest,
    db: AsyncSession = Depends(get_db),
):
    # Pre-validate URL for SSRF safety before initiating worker
    fetcher = HttpFetcher()
    try:
        fetcher.validate_url(payload.url)
    except SSRFValidationError as e:
        raise DataAPIException(
            message=f"URL validation failed: {str(e)}",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="SSRF_VALIDATION_ERROR",
        )

    worker = IngestionWorker(fetcher=fetcher)
    worker_response = await worker.run(
        url=payload.url,
        db=db,
        source_id=payload.source_id,
        chunk_size=payload.chunk_size,
        chunk_overlap=payload.chunk_overlap,
    )

    data = IngestionRunData(
        job_id=worker_response.job_id,
        status=worker_response.status,
        url=worker_response.url,
        success=worker_response.success,
        source_id=worker_response.source_id,
        resource_id=worker_response.resource_id,
        document_id=worker_response.document_id,
        chunks_count=worker_response.chunks_count,
        content_hash=worker_response.content_hash,
        is_duplicate=worker_response.is_duplicate,
        warnings=worker_response.warnings,
        errors=worker_response.errors,
        duration_ms=worker_response.duration_ms,
        meta_info=worker_response.meta_info,
    )

    if not worker_response.success:
        return APIResponse(
            success=False,
            data=data,
            message=f"Ingestion pipeline failed: {'; '.join(worker_response.errors)}",
        )

    return APIResponse(
        success=True,
        data=data,
        message="Ingestion pipeline completed successfully.",
    )
