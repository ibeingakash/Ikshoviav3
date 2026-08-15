import asyncio
from typing import Optional
import httpx
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.contracts.models import FetchResponse
from app.ingestion.contracts.source_adapter import SourceAdapter
from app.ingestion.core.pipeline import IngestionPipeline, split_text_into_chunks
from app.ingestion.core.registry import AdapterRegistry, GenericHttpAdapter
from app.ingestion.core.worker import IngestionWorker
from app.ingestion.fetchers.http_fetcher import (
    HttpFetchError,
    HttpFetcher,
    SSRFValidationError,
)
from app.ingestion.normalizers.text_normalizer import TextNormalizer
from app.ingestion.parsers.base_parser import GenericTextParser, SimpleHTMLTextExtractor
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.job import IngestionJob
from app.models.resource import Resource
from app.models.source import Source


# --- Mock HTTP Handlers for Isolated Testing ---

class MockTransport(httpx.AsyncBaseTransport):
    """Deterministic Mock transport for HTTP fetch tests."""

    def __init__(self, status_code: int = 200, content: bytes = b"", headers: dict = None, raise_timeout: bool = False):
        self.status_code = status_code
        self.content = content
        self.headers = headers or {"content-type": "text/html; charset=utf-8"}
        self.raise_timeout = raise_timeout

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        if self.raise_timeout:
            raise httpx.ReadTimeout("Request timed out", request=request)
        return httpx.Response(
            status_code=self.status_code,
            headers=self.headers,
            content=self.content,
            request=request,
        )


# --- 1. Adapter Contract & Registry Tests ---

def test_adapter_registry():
    registry = AdapterRegistry()
    assert "generic_http" in registry.list_adapters()

    class CustomPIBAdapter(SourceAdapter):
        @property
        def source_identifier(self) -> str:
            return "custom_pib"

        def can_handle(self, url: str) -> bool:
            return "pib.gov.in" in url

        async def fetch(self, url: str, fetcher: HttpFetcher) -> FetchResponse:
            return FetchResponse(url=url, status_code=200)

        async def parse(self, fetch_response: FetchResponse):
            pass

        async def normalize(self, parsed, source_id=None):
            pass

    custom_adapter = CustomPIBAdapter()
    registry.register(custom_adapter)
    assert "custom_pib" in registry.list_adapters()

    resolved = registry.resolve_for_url("https://pib.gov.in/PressReleasePage.aspx?PRID=123")
    assert resolved.source_identifier == "custom_pib"

    fallback = registry.resolve_for_url("https://example.com/other-article")
    assert fallback.source_identifier == "generic_http"

    registry.unregister("custom_pib")
    assert "custom_pib" not in registry.list_adapters()


# --- 2. URL & SSRF Validation Tests ---

def test_url_ssrf_validation():
    fetcher = HttpFetcher(allow_private_ips=False)

    # Valid schemes
    assert fetcher.validate_url("https://example.com/article") == "https://example.com/article"
    assert fetcher.validate_url("http://example.org/press") == "http://example.org/press"

    # Unsupported schemes
    with pytest.raises(SSRFValidationError, match="Unsupported URL scheme"):
        fetcher.validate_url("file:///etc/passwd")

    with pytest.raises(SSRFValidationError, match="Unsupported URL scheme"):
        fetcher.validate_url("ftp://ftp.isro.gov.in/data")

    # Localhost & Loopback rejection
    with pytest.raises(SSRFValidationError, match="forbidden loopback/local address"):
        fetcher.validate_url("http://localhost:8000/internal")

    with pytest.raises(SSRFValidationError, match="forbidden loopback/local address"):
        fetcher.validate_url("http://127.0.0.1/admin")


# --- 3. HTTP Fetcher Tests ---

@pytest.mark.asyncio
async def test_http_fetch_success():
    html_content = b"<html><head><title>Test Doc</title></head><body><p>Clean paragraph text.</p></body></html>"
    transport = MockTransport(status_code=200, content=html_content)
    async with httpx.AsyncClient(transport=transport) as client:
        fetcher = HttpFetcher(allow_private_ips=True, client=client)
        resp = await fetcher.fetch("https://example.com/test-doc")

        assert resp.status_code == 200
        assert "text/html" in resp.content_type
        assert resp.text_content.startswith("<html>")
        assert resp.content_length == len(html_content)


@pytest.mark.asyncio
async def test_http_fetch_timeout():
    transport = MockTransport(raise_timeout=True)
    async with httpx.AsyncClient(transport=transport) as client:
        fetcher = HttpFetcher(allow_private_ips=True, client=client, timeout_seconds=1.0)
        with pytest.raises(HttpFetchError, match="timed out"):
            await fetcher.fetch("https://example.com/slow-endpoint")


@pytest.mark.asyncio
async def test_http_fetch_non_200():
    transport = MockTransport(status_code=404, content=b"Not Found")
    async with httpx.AsyncClient(transport=transport) as client:
        fetcher = HttpFetcher(allow_private_ips=True, client=client)
        with pytest.raises(HttpFetchError, match="status code 404"):
            await fetcher.fetch("https://example.com/missing-doc")


# --- 4. Text Normalizer & Hashing Tests ---

def test_text_normalization_and_hashing():
    raw_dirty_text = "  First line with  extra   spaces. \r\n\r\n\r\n\r\nSecond line.  \n   \nThird line with unicode: \u092d\u093e\u0930\u0924 (Bharat).  "
    normalized = TextNormalizer.normalize(raw_dirty_text)

    # Verifies collapsed newlines
    assert "\n\n\n" not in normalized
    assert "First line with extra spaces." in normalized
    assert "\u092d\u093e\u0930\u0924 (Bharat)." in normalized

    # Deterministic hash
    hash1 = TextNormalizer.compute_hash(raw_dirty_text)
    hash2 = TextNormalizer.compute_hash(normalized)
    assert hash1 == hash2
    assert len(hash1) == 64  # SHA-256 hex


# --- 5. Parser Tests ---

def test_generic_text_parser():
    parser = GenericTextParser()
    resp = FetchResponse(
        url="https://example.com/test-article",
        status_code=200,
        content_type="text/html",
        text_content="""
        <html>
            <head>
                <title>Cabinet Decisions On Green Energy</title>
                <meta name="description" content="National Green Hydrogen summary" />
            </head>
            <body>
                <h1>Header</h1>
                <p>The Cabinet approved the scheme with Rs. 19,744 crore outlay.</p>
            </body>
        </html>
        """,
    )
    parsed = parser.parse(resp)
    assert parsed.title == "Cabinet Decisions On Green Energy"
    assert parsed.description == "National Green Hydrogen summary"
    assert "19,744 crore" in parsed.text


# --- 6. Pipeline & Worker Execution Tests ---

@pytest.mark.asyncio
async def test_ingestion_pipeline_success(db_session: AsyncSession):
    html_payload = """
    <html>
        <head><title>ISRO PSLV-C58 Mission Success</title></head>
        <body>
            <p>ISRO successfully launched the PSLV-C58 XPoSat mission to study cosmic X-rays.</p>
        </body>
    </html>
    """.encode("utf-8")

    transport = MockTransport(status_code=200, content=html_payload)
    async with httpx.AsyncClient(transport=transport) as client:
        fetcher = HttpFetcher(allow_private_ips=True, client=client)
        worker = IngestionWorker(fetcher=fetcher)

        # 1. Run worker
        result = await worker.run(
            url="https://isro.example.org/missions/pslv-c58",
            db=db_session,
            chunk_size=10,
            chunk_overlap=2,
        )

        assert result.success is True
        assert result.status == "COMPLETED"
        assert result.resource_id is not None
        assert result.document_id is not None
        assert result.chunks_count > 0
        assert result.is_duplicate is False

        # Verify DB Resource
        res_stmt = select(Resource).where(Resource.id == result.resource_id)
        res_obj = (await db_session.execute(res_stmt)).scalar_one_or_none()
        assert res_obj is not None
        assert "ISRO PSLV-C58" in res_obj.title
        assert res_obj.content_hash == result.content_hash

        # Verify DB Document
        doc_stmt = select(Document).where(Document.id == result.document_id)
        doc_obj = (await db_session.execute(doc_stmt)).scalar_one_or_none()
        assert doc_obj is not None
        assert "XPoSat mission" in doc_obj.clean_text

        # Verify DB Job
        job_stmt = select(IngestionJob).where(IngestionJob.id == result.job_id)
        job_obj = (await db_session.execute(job_stmt)).scalar_one_or_none()
        assert job_obj is not None
        assert job_obj.status == "COMPLETED"
        assert job_obj.items_processed == 1


@pytest.mark.asyncio
async def test_ingestion_duplicate_detection(db_session: AsyncSession):
    html_payload = b"<html><head><title>Duplicate Test</title></head><body><p>Static article text.</p></body></html>"
    transport = MockTransport(status_code=200, content=html_payload)

    async with httpx.AsyncClient(transport=transport) as client:
        fetcher = HttpFetcher(allow_private_ips=True, client=client)
        worker = IngestionWorker(fetcher=fetcher)

        # First run
        res1 = await worker.run(url="https://example.com/duplicate-test", db=db_session)
        assert res1.success is True
        assert res1.is_duplicate is False

        # Second run with same URL and content
        res2 = await worker.run(url="https://example.com/duplicate-test", db=db_session)
        assert res2.success is True
        assert res2.is_duplicate is True
        assert res2.resource_id == res1.resource_id
        assert res2.content_hash == res1.content_hash


@pytest.mark.asyncio
async def test_ingestion_failure_handling(db_session: AsyncSession):
    transport = MockTransport(status_code=500, content=b"Internal Server Error")
    async with httpx.AsyncClient(transport=transport) as client:
        fetcher = HttpFetcher(allow_private_ips=True, client=client)
        worker = IngestionWorker(fetcher=fetcher)

        res = await worker.run(url="https://example.com/broken-url", db=db_session)
        assert res.success is False
        assert res.status == "FAILED"
        assert len(res.errors) > 0


# --- 7. API Endpoint Tests ---

@pytest.mark.asyncio
async def test_api_ingestion_run_endpoint(client: AsyncClient):
    # Test valid request (endpoint handles mock/external via generic flow)
    # 1. Invalid SSRF URL
    bad_res = await client.post("/api/v1/ingestion/run", json={
        "url": "file:///etc/passwd",
    })
    assert bad_res.status_code == 422
    assert "Unsupported URL scheme" in bad_res.json()["error"]["message"]

    # 2. Localhost SSRF URL
    local_res = await client.post("/api/v1/ingestion/run", json={
        "url": "http://localhost:3000/secret",
    })
    assert local_res.status_code == 422
    assert "forbidden loopback" in local_res.json()["error"]["message"]
