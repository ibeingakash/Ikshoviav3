import time
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.contracts.models import (
    IngestionPipelineResult,
    NormalizedIngestionItem,
)
from app.ingestion.contracts.source_adapter import SourceAdapter
from app.ingestion.fetchers.http_fetcher import HttpFetchError, HttpFetcher, SSRFValidationError
from app.ingestion.normalizers.text_normalizer import TextNormalizer
from app.models.chunk import Chunk, generate_chunk_id
from app.models.document import Document, generate_document_id
from app.models.resource import Resource, generate_resource_id
from app.models.source import Source, generate_source_id


def split_text_into_chunks(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
    """
    Deterministically splits normalized text into word-bounded chunks with overlap.
    """
    if not text:
        return []

    words = text.split()
    if len(words) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk_words = words[start:end]
        chunks.append(" ".join(chunk_words))
        if end >= len(words):
            break
        start += max(1, chunk_size - chunk_overlap)

    return chunks


class IngestionPipeline:
    """
    Core deterministic ingestion pipeline:
    fetch -> parse -> normalize -> validate -> persist.
    
    Provider-independent: operates purely on abstract SourceAdapter and normalized models.
    """

    def __init__(self, fetcher: Optional[HttpFetcher] = None):
        self.fetcher = fetcher or HttpFetcher()

    async def execute(
        self,
        url: str,
        adapter: SourceAdapter,
        db: AsyncSession,
        source_id: Optional[str] = None,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
    ) -> IngestionPipelineResult:
        start_time = time.perf_counter()
        warnings: List[str] = []
        errors: List[str] = []

        try:
            # 1. Fetch stage
            fetch_response = await adapter.fetch(url, self.fetcher)

            # 2. Parse stage
            parsed_content = await adapter.parse(fetch_response)

            # 3. Normalize stage
            normalized_item = await adapter.normalize(parsed_content, source_id=source_id)

            # 4. Validate stage
            self._validate(normalized_item)

            # 5. Persist stage
            result = await self._persist(
                item=normalized_item,
                db=db,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
            )

            result.duration_ms = (time.perf_counter() - start_time) * 1000.0
            return result

        except (SSRFValidationError, HttpFetchError) as exc:
            errors.append(str(exc))
            return IngestionPipelineResult(
                success=False,
                url=url,
                errors=errors,
                duration_ms=(time.perf_counter() - start_time) * 1000.0,
            )
        except Exception as exc:
            errors.append(f"Unexpected pipeline execution error: {str(exc)}")
            return IngestionPipelineResult(
                success=False,
                url=url,
                errors=errors,
                duration_ms=(time.perf_counter() - start_time) * 1000.0,
            )

    def _validate(self, item: NormalizedIngestionItem) -> None:
        """Validates that normalized data conforms to ingestion minimum bounds."""
        if not item.url:
            raise ValueError("Ingestion item is missing a valid URL.")
        if not item.title:
            raise ValueError("Ingestion item is missing a title.")
        if not item.content:
            raise ValueError("Ingestion item has empty content.")
        if not item.content_hash:
            raise ValueError("Ingestion item is missing a deterministic content hash.")

    async def _get_or_create_default_source(self, db: AsyncSession, identifier: str) -> str:
        """Ensures a fallback Source record exists in the database for the given adapter."""
        slug = f"source-{identifier.lower().replace('_', '-')}"
        stmt = select(Source).where(Source.slug == slug)
        res = await db.execute(stmt)
        source = res.scalar_one_or_none()

        if not source:
            source = Source(
                id=generate_source_id(),
                name=identifier.replace("_", " ").title(),
                slug=slug,
                base_url="https://ikshovia.org",
                source_type="OTHER",
                is_active=True,
            )
            db.add(source)
            await db.flush()

        return source.id

    async def _persist(
        self,
        item: NormalizedIngestionItem,
        db: AsyncSession,
        chunk_size: int,
        chunk_overlap: int,
    ) -> IngestionPipelineResult:
        """Persists the normalized item as Resource, Document, and Chunks."""
        # 1. Resolve source_id
        source_id = item.source_id
        if source_id:
            src_stmt = select(Source).where(Source.id == source_id)
            src_res = await db.execute(src_stmt)
            if not src_res.scalar_one_or_none():
                source_id = await self._get_or_create_default_source(db, item.source_identifier)
        else:
            source_id = await self._get_or_create_default_source(db, item.source_identifier)

        # 2. Check duplicate URL or duplicate content hash
        existing_stmt = select(Resource).where(Resource.url == item.url)
        existing_res = await db.execute(existing_stmt)
        existing_resource = existing_res.scalar_one_or_none()

        if existing_resource:
            # Check if content matches
            if existing_resource.content_hash == item.content_hash:
                # Find document linked to this resource
                doc_stmt = select(Document).where(Document.resource_id == existing_resource.id)
                doc_res = await db.execute(doc_stmt)
                doc = doc_res.scalars().first()

                doc_id = doc.id if doc else None
                chunk_ids = [c.id for c in doc.chunks] if doc and doc.chunks else []

                return IngestionPipelineResult(
                    success=True,
                    url=item.url,
                    source_id=existing_resource.source_id,
                    resource_id=existing_resource.id,
                    document_id=doc_id,
                    chunk_ids=chunk_ids,
                    chunks_count=len(chunk_ids),
                    content_hash=item.content_hash,
                    is_duplicate=True,
                    warnings=["Resource with identical URL and content hash already ingested."],
                )
            else:
                # Content changed on the same URL: update Resource hash
                existing_resource.content_hash = item.content_hash
                existing_resource.title = item.title
                existing_resource.status = "EXTRACTED"
                resource = existing_resource
        else:
            # Create new Resource
            resource = Resource(
                id=generate_resource_id(),
                source_id=source_id,
                title=item.title,
                url=item.url,
                resource_type=item.content_type,
                description=item.description,
                published_at=item.published_at,
                content_hash=item.content_hash,
                status="EXTRACTED",
            )
            db.add(resource)
            await db.flush()

        # 3. Create Document
        document = Document(
            id=generate_document_id(),
            resource_id=resource.id,
            raw_text=item.content,
            clean_text=item.content,
            mime_type=item.mime_type,
            file_size_bytes=len(item.content.encode("utf-8")),
            language=item.language,
            meta_info=item.meta_info,
            extraction_status="EXTRACTED",
            extraction_method=item.extraction_method,
        )
        db.add(document)
        await db.flush()

        # 4. Generate Chunks
        chunk_texts = split_text_into_chunks(item.content, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        created_chunk_ids: List[str] = []

        for idx, c_text in enumerate(chunk_texts):
            c_hash = TextNormalizer.compute_hash(c_text)
            chunk = Chunk(
                id=generate_chunk_id(),
                document_id=document.id,
                chunk_index=idx,
                content=c_text,
                token_count=len(c_text.split()),
                character_count=len(c_text),
                heading=item.title,
                section=f"Part {idx + 1}",
                chunk_hash=c_hash,
            )
            db.add(chunk)
            created_chunk_ids.append(chunk.id)

        await db.commit()

        return IngestionPipelineResult(
            success=True,
            url=item.url,
            source_id=source_id,
            resource_id=resource.id,
            document_id=document.id,
            chunk_ids=created_chunk_ids,
            chunks_count=len(created_chunk_ids),
            content_hash=item.content_hash,
            is_duplicate=False,
            metadata={"word_count": len(item.content.split()), "char_count": len(item.content)},
        )
