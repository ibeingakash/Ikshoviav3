from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func

from app.ingestion.contracts.models import IngestionPipelineResult
from app.ingestion.core.pipeline import IngestionPipeline
from app.ingestion.core.registry import adapter_registry, AdapterRegistry
from app.ingestion.fetchers.http_fetcher import HttpFetcher
from app.models.job import IngestionJob, generate_job_id


class IngestionWorkerResponse(BaseModel):
    """Execution response returned by IngestionWorker."""
    job_id: str
    status: str
    url: str
    success: bool
    source_id: Optional[str] = None
    resource_id: Optional[str] = None
    document_id: Optional[str] = None
    chunks_count: int = 0
    content_hash: Optional[str] = None
    is_duplicate: bool = False
    warnings: List[str] = []
    errors: List[str] = []
    duration_ms: float = 0.0
    meta_info: Dict[str, Any] = {}


class IngestionWorker:
    """
    Worker coordinating the ingestion lifecycle, job tracking,
    adapter resolution, and pipeline execution.
    """

    def __init__(
        self,
        registry: Optional[AdapterRegistry] = None,
        fetcher: Optional[HttpFetcher] = None,
    ):
        self.registry = registry or adapter_registry
        self.fetcher = fetcher or HttpFetcher()
        self.pipeline = IngestionPipeline(fetcher=self.fetcher)

    async def run(
        self,
        url: str,
        db: AsyncSession,
        source_id: Optional[str] = None,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
    ) -> IngestionWorkerResponse:
        """
        Executes a complete ingestion cycle with full IngestionJob lifecycle tracking.
        """
        # 1. Create IngestionJob in PENDING state
        job = IngestionJob(
            id=generate_job_id(),
            source_id=source_id,
            job_type="INGESTION_PIPELINE",
            status="PENDING",
            progress_percentage=0,
            items_processed=0,
            total_items=1,
            meta_info={"target_url": url},
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        # 2. Transition job to RUNNING
        job.status = "RUNNING"
        job.started_at = datetime.utcnow()
        job.progress_percentage = 20
        await db.commit()

        # 3. Resolve appropriate source adapter
        adapter = self.registry.resolve_for_url(url)

        # 4. Execute the pipeline
        pipeline_result: IngestionPipelineResult = await self.pipeline.execute(
            url=url,
            adapter=adapter,
            db=db,
            source_id=source_id,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

        # 5. Update IngestionJob state based on outcome
        job.completed_at = datetime.utcnow()
        job.progress_percentage = 100

        if pipeline_result.success:
            job.status = "COMPLETED"
            job.items_processed = 1
            job.resource_id = pipeline_result.resource_id
            job.source_id = pipeline_result.source_id or source_id
            job.meta_info = {
                "target_url": url,
                "adapter": adapter.source_identifier,
                "chunks_count": pipeline_result.chunks_count,
                "is_duplicate": pipeline_result.is_duplicate,
                "content_hash": pipeline_result.content_hash,
                "duration_ms": pipeline_result.duration_ms,
            }
            if pipeline_result.warnings:
                job.error_log = "Warnings: " + " | ".join(pipeline_result.warnings)
        else:
            job.status = "FAILED"
            job.error_log = "Errors: " + " | ".join(pipeline_result.errors)
            job.meta_info = {
                "target_url": url,
                "adapter": adapter.source_identifier,
                "duration_ms": pipeline_result.duration_ms,
            }

        await db.commit()
        await db.refresh(job)

        return IngestionWorkerResponse(
            job_id=job.id,
            status=job.status,
            url=url,
            success=pipeline_result.success,
            source_id=pipeline_result.source_id,
            resource_id=pipeline_result.resource_id,
            document_id=pipeline_result.document_id,
            chunks_count=pipeline_result.chunks_count,
            content_hash=pipeline_result.content_hash,
            is_duplicate=pipeline_result.is_duplicate,
            warnings=pipeline_result.warnings,
            errors=pipeline_result.errors,
            duration_ms=pipeline_result.duration_ms,
            meta_info=job.meta_info or {},
        )
