from datetime import datetime
from pathlib import Path
import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.adapters.indiagov_adapter import IndiaGovAdapter
from app.ingestion.contracts.models import FetchResponse
from app.ingestion.core.pipeline import IngestionPipeline
from app.ingestion.core.registry import adapter_registry
from app.ingestion.fetchers.http_fetcher import HttpFetcher
from app.ingestion.parsers.indiagov_parser import IndiaGovParser
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.resource import Resource


FIXTURES_DIR = Path(__file__).parent / "fixtures" / "indiagov"


def load_fixture(filename: str) -> str:
    with open(FIXTURES_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()


def test_indiagov_url_detection():
    adapter = IndiaGovAdapter()
    valid_urls = [
        "https://www.india.gov.in/my-government/constitution-india",
        "https://india.gov.in/topics/governance-administration",
        "https://knowindia.india.gov.in/national-identity-elements/national-symbol.php",
        "https://knowindia.gov.in/states-uts",
    ]
    for url in valid_urls:
        assert adapter.can_handle(url) is True, f"Failed to detect valid India.gov.in URL: {url}"


def test_non_indiagov_url_rejection():
    adapter = IndiaGovAdapter()
    invalid_urls = [
        "https://pib.gov.in",
        "https://rbi.org.in",
        "https://example.com/india.gov.in",
        "file:///etc/passwd",
        "",
    ]
    for url in invalid_urls:
        assert adapter.can_handle(url) is False, f"Failed to reject non-India.gov.in URL: {url}"


def test_indiagov_topic_parsing():
    parser = IndiaGovParser()
    html_content = load_fixture("indiagov_topic.html")
    fetch_resp = FetchResponse(
        url="https://india.gov.in/constitution",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "Constitutional Framework and Union Executive of India" in parsed.title
    assert parsed.published_at == datetime(2024, 9, 14)
    assert "Governance & Administration" in parsed.metadata.get("category", "")
    assert "Sovereign, Socialist, Secular, Democratic Republic" in parsed.text
    assert "26 November 1949" in parsed.text

    pdf_links = parsed.metadata.get("pdf_links", [])
    assert len(pdf_links) == 1
    assert "full-text.pdf" in pdf_links[0]["url"]


def test_indiagov_hindi_parsing():
    parser = IndiaGovParser()
    html_content = load_fixture("indiagov_hindi.html")
    fetch_resp = FetchResponse(
        url="https://india.gov.in/hi/national-symbols",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "भारत का राष्ट्रीय प्रतीक: सारनाथ का सिंह शीर्ष" in parsed.title
    assert parsed.language == "hi"
    assert parsed.published_at == datetime(2024, 8, 15)
    assert "अशोक के सिंह स्तंभ की अनुकृति" in parsed.text


def test_indiagov_malformed_html_handling():
    parser = IndiaGovParser()
    html_content = load_fixture("indiagov_malformed.html")
    fetch_resp = FetchResponse(
        url="https://india.gov.in/flag-code",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "National Flag Code of India" in parsed.title
    assert "National Tricolour" in parsed.text


@pytest.mark.asyncio
async def test_indiagov_adapter_normalization():
    adapter = IndiaGovAdapter()
    html_content = load_fixture("indiagov_topic.html")
    fetch_resp = FetchResponse(
        url="https://india.gov.in/constitution",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = await adapter.parse(fetch_resp)
    normalized = await adapter.normalize(parsed)

    assert normalized.source_identifier == "indiagov"
    assert normalized.extraction_method == "INDIAGOV_ADAPTER"
    assert normalized.content_type == "ARTICLE"
    assert len(normalized.content_hash) == 64


def test_indiagov_adapter_registry_resolution():
    url = "https://india.gov.in/my-government/schemes"
    resolved = adapter_registry.resolve_for_url(url)
    assert resolved.source_identifier == "indiagov"
    assert isinstance(resolved, IndiaGovAdapter)


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
async def test_indiagov_ingestion_pipeline(db_session: AsyncSession):
    html_content = load_fixture("indiagov_topic.html").encode("utf-8")
    url = "https://india.gov.in/topics/governance"

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
        assert doc.extraction_method == "INDIAGOV_ADAPTER"
