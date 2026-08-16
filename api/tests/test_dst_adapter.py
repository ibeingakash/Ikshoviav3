from datetime import datetime
from pathlib import Path
import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.adapters.dst_adapter import DSTAdapter
from app.ingestion.contracts.models import FetchResponse
from app.ingestion.core.pipeline import IngestionPipeline
from app.ingestion.core.registry import adapter_registry
from app.ingestion.fetchers.http_fetcher import HttpFetcher
from app.ingestion.parsers.dst_parser import DSTParser
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.resource import Resource


FIXTURES_DIR = Path(__file__).parent / "fixtures" / "dst"


def load_fixture(filename: str) -> str:
    with open(FIXTURES_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()


def test_dst_url_detection():
    adapter = DSTAdapter()
    valid_urls = [
        "https://dst.gov.in/national-quantum-mission",
        "https://www.dst.gov.in/scientific-programmes/inspire",
        "https://online-dst.gov.in/project-portal",
    ]
    for url in valid_urls:
        assert adapter.can_handle(url) is True, f"Failed to detect valid DST URL: {url}"


def test_non_dst_url_rejection():
    adapter = DSTAdapter()
    invalid_urls = [
        "https://pib.gov.in",
        "https://rbi.org.in",
        "https://example.com/dst.gov.in",
        "file:///etc/passwd",
        "",
    ]
    for url in invalid_urls:
        assert adapter.can_handle(url) is False, f"Failed to reject non-DST URL: {url}"


def test_dst_scheme_parsing():
    parser = DSTParser()
    html_content = load_fixture("dst_scheme.html")
    fetch_resp = FetchResponse(
        url="https://dst.gov.in/nqm-2024",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "National Quantum Mission" in parsed.title
    assert parsed.published_at == datetime(2024, 8, 25)
    assert "Frontier & Futuristic Technologies" in parsed.metadata.get("division", "")
    assert "intermediate-scale quantum computers" in parsed.text
    assert "Quantum Computing" in parsed.text

    pdf_links = parsed.metadata.get("pdf_links", [])
    assert len(pdf_links) == 1
    assert "NQM_Guidelines_2024.pdf" in pdf_links[0]["url"]


def test_dst_hindi_parsing():
    parser = DSTParser()
    html_content = load_fixture("dst_hindi.html")
    fetch_resp = FetchResponse(
        url="https://dst.gov.in/hi/nqm",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "राष्ट्रीय क्वांटम मिशन: भारत में क्वांटम प्रौद्योगिकी का विकास" in parsed.title
    assert parsed.language == "hi"
    assert parsed.published_at == datetime(2024, 8, 25)
    assert "क्वांटम प्रौद्योगिकी के क्षेत्र में" in parsed.text


def test_dst_malformed_html_handling():
    parser = DSTParser()
    html_content = load_fixture("dst_malformed.html")
    fetch_resp = FetchResponse(
        url="https://dst.gov.in/inspire",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "INSPIRE Fellowship Scheme" in parsed.title
    assert "young researchers in basic and applied sciences" in parsed.text


@pytest.mark.asyncio
async def test_dst_adapter_normalization():
    adapter = DSTAdapter()
    html_content = load_fixture("dst_scheme.html")
    fetch_resp = FetchResponse(
        url="https://dst.gov.in/nqm",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = await adapter.parse(fetch_resp)
    normalized = await adapter.normalize(parsed)

    assert normalized.source_identifier == "dst"
    assert normalized.extraction_method == "DST_ADAPTER"
    assert normalized.content_type == "ARTICLE"
    assert len(normalized.content_hash) == 64


def test_dst_adapter_registry_resolution():
    url = "https://dst.gov.in/programmes/quantum"
    resolved = adapter_registry.resolve_for_url(url)
    assert resolved.source_identifier == "dst"
    assert isinstance(resolved, DSTAdapter)


class MockTransport(httpx.AsyncBaseTransport):
    def __init__(self, status_code: int = 200, content: bytes = b"", headers: dict = None):
        self.status_code = status_code
        self.content = content
        self.headers = headers or {"content-type": "text/html; charset=utf-8"}

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code=self.status_code,
            headers=self.headers,
            content=self.content,
            request=request,
        )


@pytest.mark.asyncio
async def test_dst_ingestion_pipeline(db_session: AsyncSession):
    html_content = load_fixture("dst_scheme.html").encode("utf-8")
    url = "https://dst.gov.in/schemes/nqm"

    transport = MockTransport(status_code=200, content=html_content)
    async with httpx.AsyncClient(transport=transport) as client:
        fetcher = HttpFetcher(allow_private_ips=True, client=client)
        pipeline = IngestionPipeline(fetcher=fetcher)
        adapter = adapter_registry.resolve_for_url(url)

        result = await pipeline.execute(
            url=url,
            adapter=adapter,
            db=db_session,
            chunk_size=100,
            chunk_overlap=20,
        )

        assert result.success is True
        assert result.resource_id is not None
        assert result.document_id is not None

        stmt = select(Document).where(Document.id == result.document_id)
        doc = (await db_session.execute(stmt)).scalar_one_or_none()
        assert doc is not None
        assert doc.extraction_method == "DST_ADAPTER"
