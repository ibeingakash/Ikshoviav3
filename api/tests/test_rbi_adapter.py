from datetime import datetime
from pathlib import Path
import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.adapters.rbi_adapter import RBIAdapter
from app.ingestion.contracts.models import FetchResponse
from app.ingestion.core.pipeline import IngestionPipeline
from app.ingestion.core.registry import adapter_registry
from app.ingestion.fetchers.http_fetcher import HttpFetcher
from app.ingestion.parsers.rbi_parser import RBIParser
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.resource import Resource


FIXTURES_DIR = Path(__file__).parent / "fixtures" / "rbi"


def load_fixture(filename: str) -> str:
    with open(FIXTURES_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()


def test_rbi_url_detection():
    adapter = RBIAdapter()
    valid_urls = [
        "https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=58900",
        "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12700&Mode=0",
        "https://rbidocs.rbi.org.in/rdocs/PressRelease/PDFs/PR1648.PDF",
        "http://m.rbi.org.in/scripts/BS_ViewMasCirculardetails.aspx?id=12500",
    ]
    for url in valid_urls:
        assert adapter.can_handle(url) is True, f"Failed to detect valid RBI URL: {url}"


def test_non_rbi_url_rejection():
    adapter = RBIAdapter()
    invalid_urls = [
        "https://pib.gov.in/PressReleasePage.aspx",
        "https://upsc.gov.in",
        "https://example.com/rbi.org.in",
        "https://rbi.org.in.attacker.com",
        "file:///etc/passwd",
        "",
    ]
    for url in invalid_urls:
        assert adapter.can_handle(url) is False, f"Failed to reject non-RBI URL: {url}"


def test_rbi_press_release_parsing():
    parser = RBIParser()
    html_content = load_fixture("rbi_press_release.html")
    fetch_resp = FetchResponse(
        url="https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=58900",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "Monetary Policy Statement 2024-25" in parsed.title
    assert parsed.published_at == datetime(2024, 12, 6)
    assert parsed.metadata.get("reference_number") == "2024-2025/1648"
    assert parsed.metadata.get("department") == "Monetary Policy Department"
    assert "policy repo rate under the liquidity adjustment facility" in parsed.text.lower()
    assert "Policy Repo Rate | 6.50" in parsed.text

    # PDF links
    pdf_links = parsed.metadata.get("pdf_links", [])
    assert len(pdf_links) == 1
    assert "PR1648MPCDEC2024.PDF" in pdf_links[0]["url"]


def test_rbi_notification_parsing():
    parser = RBIParser()
    html_content = load_fixture("rbi_notification.html")
    fetch_resp = FetchResponse(
        url="https://rbi.org.in/Scripts/NotificationUser.aspx?Id=12700",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "Prudential Norms on Income Recognition" in parsed.title
    assert parsed.metadata.get("reference_number") == "RBI/2024-25/88"
    assert parsed.metadata.get("department") == "Department of Supervision"
    assert parsed.published_at == datetime(2024, 10, 11)
    assert "Scheduled Commercial Banks" in parsed.text

    pdf_links = parsed.metadata.get("pdf_links", [])
    assert len(pdf_links) == 1
    assert "NOTIF88OCT2024.PDF" in pdf_links[0]["url"]


def test_rbi_hindi_parsing():
    parser = RBIParser()
    html_content = load_fixture("rbi_hindi_release.html")
    fetch_resp = FetchResponse(
        url="https://rbi.org.in/hindi/Scripts/PressRelease.aspx",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "भारतीय रिज़र्व बैंक की मौद्रिक नीति समिति" in parsed.title
    assert parsed.language == "hi"
    assert parsed.metadata.get("department") == "मौद्रिक नीति विभाग"
    assert parsed.metadata.get("reference_number") == "2024-2025/1648"
    assert parsed.published_at == datetime(2024, 12, 6)


def test_rbi_malformed_html_handling():
    parser = RBIParser()
    html_content = load_fixture("rbi_malformed.html")
    fetch_resp = FetchResponse(
        url="https://rbi.org.in/partial.aspx",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "Partial RBI Release" in parsed.title
    assert "Inflation monitoring framework" in parsed.text
    pdf_links = parsed.metadata.get("pdf_links", [])
    assert len(pdf_links) == 1


@pytest.mark.asyncio
async def test_rbi_adapter_normalization():
    adapter = RBIAdapter()
    html_content = load_fixture("rbi_press_release.html")
    fetch_resp = FetchResponse(
        url="https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=58900",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = await adapter.parse(fetch_resp)
    normalized = await adapter.normalize(parsed)

    assert normalized.source_identifier == "rbi"
    assert normalized.extraction_method == "RBI_ADAPTER"
    assert normalized.content_type == "ARTICLE"
    assert len(normalized.content_hash) == 64
    assert normalized.meta_info.get("reference_number") == "2024-2025/1648"


def test_rbi_adapter_registry_resolution():
    url = "https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=58900"
    resolved = adapter_registry.resolve_for_url(url)
    assert resolved.source_identifier == "rbi"
    assert isinstance(resolved, RBIAdapter)


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
async def test_rbi_ingestion_pipeline(db_session: AsyncSession):
    html_content = load_fixture("rbi_press_release.html").encode("utf-8")
    url = "https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=58900"

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
        assert result.is_duplicate is False
        assert result.resource_id is not None
        assert result.document_id is not None
        assert result.chunks_count > 0

        # Check document in database
        stmt = select(Document).where(Document.id == result.document_id)
        doc = (await db_session.execute(stmt)).scalar_one_or_none()
        assert doc is not None
        assert doc.extraction_method == "RBI_ADAPTER"
        assert doc.meta_info.get("reference_number") == "2024-2025/1648"
