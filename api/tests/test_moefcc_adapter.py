from datetime import datetime
from pathlib import Path
import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.adapters.moefcc_adapter import MoEFCCAdapter
from app.ingestion.contracts.models import FetchResponse
from app.ingestion.core.pipeline import IngestionPipeline
from app.ingestion.core.registry import adapter_registry
from app.ingestion.fetchers.http_fetcher import HttpFetcher
from app.ingestion.parsers.moefcc_parser import MoEFCCParser
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.resource import Resource


FIXTURES_DIR = Path(__file__).parent / "fixtures" / "moefcc"


def load_fixture(filename: str) -> str:
    with open(FIXTURES_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()


def test_moefcc_url_detection():
    adapter = MoEFCCAdapter()
    valid_urls = [
        "https://moef.gov.in/en/division/forest-conservation",
        "https://moefcc.gov.in/rules-and-regulations",
        "https://parivesh.nic.in/clearance-portal",
        "https://forestsclearance.nic.in/project-tracking",
    ]
    for url in valid_urls:
        assert adapter.can_handle(url) is True, f"Failed to detect valid MoEFCC URL: {url}"


def test_non_moefcc_url_rejection():
    adapter = MoEFCCAdapter()
    invalid_urls = [
        "https://pib.gov.in",
        "https://rbi.org.in",
        "https://example.com/moef.gov.in",
        "file:///etc/passwd",
        "",
    ]
    for url in invalid_urls:
        assert adapter.can_handle(url) is False, f"Failed to reject non-MoEFCC URL: {url}"


def test_moefcc_policy_parsing():
    parser = MoEFCCParser()
    html_content = load_fixture("moefcc_policy.html")
    fetch_resp = FetchResponse(
        url="https://moef.gov.in/ncap-guidelines",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "National Clean Air Programme" in parsed.title
    assert parsed.published_at == datetime(2024, 1, 10)
    assert "Air Quality Management" in parsed.metadata.get("division", "")
    assert parsed.metadata.get("notification_no") == "Q-16017/38/2023-CPA"
    assert "PM10 concentration by 2025-26" in parsed.text

    pdf_links = parsed.metadata.get("pdf_links", [])
    assert len(pdf_links) == 1
    assert "ncap_guidelines_2024.pdf" in pdf_links[0]["url"]


def test_moefcc_hindi_parsing():
    parser = MoEFCCParser()
    html_content = load_fixture("moefcc_hindi.html")
    fetch_resp = FetchResponse(
        url="https://moef.gov.in/hi/ramsar-wetlands",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "विश्व आर्द्रभूमि दिवस: भारत में 80 रामसर स्थल घोषित" in parsed.title
    assert parsed.language == "hi"
    assert parsed.published_at == datetime(2024, 2, 2)
    assert "80 रामसर स्थलों" in parsed.text


def test_moefcc_malformed_html_handling():
    parser = MoEFCCParser()
    html_content = load_fixture("moefcc_malformed.html")
    fetch_resp = FetchResponse(
        url="https://moef.gov.in/project-tiger",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "Project Tiger and Project Elephant Joint Guidelines" in parsed.title
    assert "Protected area network management" in parsed.text


@pytest.mark.asyncio
async def test_moefcc_adapter_normalization():
    adapter = MoEFCCAdapter()
    html_content = load_fixture("moefcc_policy.html")
    fetch_resp = FetchResponse(
        url="https://moef.gov.in/ncap",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = await adapter.parse(fetch_resp)
    normalized = await adapter.normalize(parsed)

    assert normalized.source_identifier == "moefcc"
    assert normalized.extraction_method == "MOEFCC_ADAPTER"
    assert normalized.content_type == "ARTICLE"
    assert len(normalized.content_hash) == 64


def test_moefcc_adapter_registry_resolution():
    url = "https://moef.gov.in/ncap-update"
    resolved = adapter_registry.resolve_for_url(url)
    assert resolved.source_identifier == "moefcc"
    assert isinstance(resolved, MoEFCCAdapter)


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
async def test_moefcc_ingestion_pipeline(db_session: AsyncSession):
    html_content = load_fixture("moefcc_policy.html").encode("utf-8")
    url = "https://moef.gov.in/policies/ncap-2024"

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
        assert doc.extraction_method == "MOEFCC_ADAPTER"
