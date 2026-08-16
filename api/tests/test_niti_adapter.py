from datetime import datetime
from pathlib import Path
import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.adapters.niti_adapter import NITIAdapter
from app.ingestion.contracts.models import FetchResponse
from app.ingestion.core.pipeline import IngestionPipeline
from app.ingestion.core.registry import adapter_registry
from app.ingestion.fetchers.http_fetcher import HttpFetcher
from app.ingestion.parsers.niti_parser import NITIParser
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.resource import Resource


FIXTURES_DIR = Path(__file__).parent / "fixtures" / "niti"


def load_fixture(filename: str) -> str:
    with open(FIXTURES_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()


def test_niti_url_detection():
    adapter = NITIAdapter()
    valid_urls = [
        "https://www.niti.gov.in/report-and-publication/sdg-index",
        "https://niti.gov.in/aspirational-districts-programme",
        "https://nitiaayog.gov.in/publications",
    ]
    for url in valid_urls:
        assert adapter.can_handle(url) is True, f"Failed to detect valid NITI URL: {url}"


def test_non_niti_url_rejection():
    adapter = NITIAdapter()
    invalid_urls = [
        "https://pib.gov.in",
        "https://rbi.org.in",
        "https://example.com/niti.gov.in",
        "file:///etc/passwd",
        "",
    ]
    for url in invalid_urls:
        assert adapter.can_handle(url) is False, f"Failed to reject non-NITI URL: {url}"


def test_niti_report_parsing():
    parser = NITIParser()
    html_content = load_fixture("niti_report.html")
    fetch_resp = FetchResponse(
        url="https://www.niti.gov.in/sdg-index-2024",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "SDG India Index 2023-24" in parsed.title
    assert parsed.published_at == datetime(2024, 7, 12)
    assert "Sustainable Development Goals (SDG)" in parsed.metadata.get("vertical", "")
    assert "India's overall SDG score improved to 74" in parsed.text
    assert "Kerala and Uttarakhand" in parsed.text

    # PDF links
    pdf_links = parsed.metadata.get("pdf_links", [])
    assert len(pdf_links) == 1
    assert "SDG_India_Index_2023_24_Report.pdf" in pdf_links[0]["url"]


def test_niti_initiative_parsing():
    parser = NITIParser()
    html_content = load_fixture("niti_initiative.html")
    fetch_resp = FetchResponse(
        url="https://www.niti.gov.in/adp",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "Transforming 112 Aspirational Districts" in parsed.title
    assert "Rural Development" in parsed.metadata.get("vertical", "")
    assert "Convergence" in parsed.text

    pdf_links = parsed.metadata.get("pdf_links", [])
    assert len(pdf_links) == 1
    assert "adp_framework.pdf" in pdf_links[0]["url"]


def test_niti_hindi_parsing():
    parser = NITIParser()
    html_content = load_fixture("niti_hindi.html")
    fetch_resp = FetchResponse(
        url="https://www.niti.gov.in/hi/mpi-report",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "राष्ट्रीय बहुआयामी गरीबी सूचकांक" in parsed.title
    assert parsed.language == "hi"
    assert "13.5 करोड़ लोग" in parsed.text


def test_niti_malformed_html_handling():
    parser = NITIParser()
    html_content = load_fixture("niti_malformed.html")
    fetch_resp = FetchResponse(
        url="https://niti.gov.in/mobility",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "National Mission on Transformative Mobility" in parsed.title
    assert "Clean mobility transition" in parsed.text


@pytest.mark.asyncio
async def test_niti_adapter_normalization():
    adapter = NITIAdapter()
    html_content = load_fixture("niti_report.html")
    fetch_resp = FetchResponse(
        url="https://www.niti.gov.in/sdg-index",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = await adapter.parse(fetch_resp)
    normalized = await adapter.normalize(parsed)

    assert normalized.source_identifier == "niti"
    assert normalized.extraction_method == "NITI_ADAPTER"
    assert normalized.content_type == "ARTICLE"
    assert len(normalized.content_hash) == 64


def test_niti_adapter_registry_resolution():
    url = "https://www.niti.gov.in/report-2024"
    resolved = adapter_registry.resolve_for_url(url)
    assert resolved.source_identifier == "niti"
    assert isinstance(resolved, NITIAdapter)


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
async def test_niti_ingestion_pipeline(db_session: AsyncSession):
    html_content = load_fixture("niti_report.html").encode("utf-8")
    url = "https://www.niti.gov.in/reports/sdg-2024"

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
        assert doc.extraction_method == "NITI_ADAPTER"
