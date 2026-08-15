from datetime import datetime
import os
from pathlib import Path
import httpx
import pytest
from httpx import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.adapters.pib_adapter import PIBAdapter
from app.ingestion.contracts.models import FetchResponse
from app.ingestion.core.pipeline import IngestionPipeline
from app.ingestion.core.registry import adapter_registry
from app.ingestion.fetchers.http_fetcher import HttpFetcher
from app.ingestion.parsers.pib_parser import PIBParser, parse_pib_release_date, detect_language
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.resource import Resource


FIXTURES_DIR = Path(__file__).parent / "fixtures" / "pib"


def load_fixture(filename: str) -> str:
    with open(FIXTURES_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()


def test_pib_url_detection():
    adapter = PIBAdapter()
    valid_urls = [
        "https://pib.gov.in/PressReleasePage.aspx?PRID=2085000",
        "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2085000",
        "https://pib.gov.in/PressReleaseIframePage.aspx?PRID=2000100",
        "https://pib.gov.in/Pressreleaseshare.aspx?PRID=1999955",
        "http://pib.nic.in/newsite/PrintRelease.aspx?relid=190000",
        "https://www.pib.nic.in/pressrelease.aspx",
    ]
    for url in valid_urls:
        assert adapter.can_handle(url) is True, f"Failed to detect valid PIB URL: {url}"


def test_non_pib_url_rejection():
    adapter = PIBAdapter()
    invalid_urls = [
        "https://www.isro.gov.in/",
        "https://upsc.gov.in/examinations",
        "https://example.com/pib.gov.in",
        "https://pib.gov.in.attacker.com/page",
        "https://notpib.gov.in/release",
        "file:///etc/passwd",
        "http://localhost:3000",
        "",
        "invalid-url",
    ]
    for url in invalid_urls:
        assert adapter.can_handle(url) is False, f"Failed to reject non-PIB URL: {url}"


def test_pib_title_extraction():
    parser = PIBParser()
    html_content = load_fixture("pib_english_release.html")
    fetch_resp = FetchResponse(
        url="https://pib.gov.in/PressReleasePage.aspx?PRID=2085000",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    assert parsed.title == "Smart India Hackathon 2024 Concludes with Innovative Solutions"


def test_pib_publication_date_extraction():
    parser = PIBParser()
    html_content = load_fixture("pib_english_release.html")
    fetch_resp = FetchResponse(
        url="https://pib.gov.in/PressReleasePage.aspx?PRID=2085000",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    assert parsed.published_at == datetime(2024, 12, 16, 19, 40)
    assert parsed.metadata.get("pib_location") == "PIB Mumbai"
    assert "16 DEC 2024" in parsed.metadata.get("pib_release_date_str", "")


def test_pib_ministry_extraction():
    parser = PIBParser()
    html_content = load_fixture("pib_english_release.html")
    fetch_resp = FetchResponse(
        url="https://pib.gov.in/PressReleasePage.aspx?PRID=2085000",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    assert parsed.metadata.get("ministry") == "Ministry of Education"
    assert parsed.metadata.get("subtitle") == "Celebrating student innovation across nation"
    assert parsed.metadata.get("release_id") == "2085000"


def test_pib_article_body_extraction():
    parser = PIBParser()
    html_content = load_fixture("pib_english_release.html")
    fetch_resp = FetchResponse(
        url="https://pib.gov.in/PressReleasePage.aspx?PRID=2085000",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    text = parsed.text

    assert "Smart India Hackathon 2024 (SIH)" in text
    assert "MIT Art, Design, and Technology University, Pune" in text
    assert "Team Jagarama007" in text
    assert "Paradox Innovator" in text


def test_pib_navigation_removal():
    parser = PIBParser()
    html_content = load_fixture("pib_english_release.html")
    fetch_resp = FetchResponse(
        url="https://pib.gov.in/PressReleasePage.aspx?PRID=2085000",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    text = parsed.text

    assert "PIB Home" not in text
    assert "Press Releases" not in text
    assert "Media" not in text


def test_pib_footer_removal():
    parser = PIBParser()
    html_content = load_fixture("pib_english_release.html")
    fetch_resp = FetchResponse(
        url="https://pib.gov.in/PressReleasePage.aspx?PRID=2085000",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    text = parsed.text

    assert "All rights reserved" not in text
    assert "Share on X" not in text
    assert "Share on Facebook" not in text


def test_pib_ticker_sidebar_removal():
    parser = PIBParser()
    html_content = load_fixture("pib_english_release.html")
    fetch_resp = FetchResponse(
        url="https://pib.gov.in/PressReleasePage.aspx?PRID=2085000",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    text = parsed.text

    assert "Ticker Headline That Must Not Be In Extracted Article Body" not in text
    assert "Sidebar Link 1" not in text
    assert "Sidebar Link 2" not in text


def test_pib_unicode_preservation():
    parser = PIBParser()
    hindi_html = load_fixture("pib_hindi_release.html")
    fetch_resp = FetchResponse(
        url="https://pib.gov.in/PressReleasePage.aspx?PRID=2100000",
        status_code=200,
        content_type="text/html",
        text_content=hindi_html,
    )
    parsed = parser.parse(fetch_resp)

    assert "विशेष इस्पात के लिए उत्पादन से जुड़ी प्रोत्साहन" in parsed.title
    assert parsed.metadata.get("ministry") == "इस्‍पात मंत्रालय"
    assert "29,530 करोड़ रुपये" in parsed.text
    assert parsed.language == "hi"
    assert parsed.published_at == datetime(2025, 2, 4, 17, 52)


def test_pib_missing_optional_metadata():
    parser = PIBParser()
    minimal_html = load_fixture("pib_minimal_release.html")
    fetch_resp = FetchResponse(
        url="https://pib.gov.in/PressReleasePage.aspx?PRID=12345",
        status_code=200,
        content_type="text/html",
        text_content=minimal_html,
    )
    parsed = parser.parse(fetch_resp)

    assert parsed.title == "Key Cabinet Decisions Announced"
    assert parsed.metadata.get("ministry") is None
    assert parsed.published_at is None
    assert "rural infrastructure and modern transport corridors" in parsed.text


def test_pib_malformed_html_handling():
    parser = PIBParser()
    malformed_html = load_fixture("pib_malformed.html")
    fetch_resp = FetchResponse(
        url="https://pib.gov.in/PressReleasePage.aspx?PRID=99999",
        status_code=200,
        content_type="text/html",
        text_content=malformed_html,
    )
    parsed = parser.parse(fetch_resp)

    assert "Malformed Tag Document" in parsed.title
    assert "Direct tax collection figures" in parsed.text
    assert parsed.metadata.get("ministry") == "Ministry of Finance"


@pytest.mark.asyncio
async def test_pib_normalized_output():
    adapter = PIBAdapter()
    html_content = load_fixture("pib_english_release.html")
    fetch_resp = FetchResponse(
        url="https://pib.gov.in/PressReleasePage.aspx?PRID=2085000",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = await adapter.parse(fetch_resp)
    normalized = await adapter.normalize(parsed)

    assert normalized.source_identifier == "pib"
    assert normalized.extraction_method == "PIB_ADAPTER"
    assert normalized.content_type == "ARTICLE"
    assert len(normalized.content_hash) == 64
    assert normalized.meta_info.get("ministry") == "Ministry of Education"


def test_pib_adapter_registry_resolution():
    pib_adapter = adapter_registry.resolve_for_url("https://pib.gov.in/PressReleasePage.aspx?PRID=2085000")
    assert pib_adapter.source_identifier == "pib"
    assert isinstance(pib_adapter, PIBAdapter)

    generic_adapter = adapter_registry.resolve_for_url("https://www.isro.gov.in/")
    assert generic_adapter.source_identifier == "generic_http"


class MockTransport(httpx.AsyncBaseTransport):
    """Deterministic Mock transport for HTTP fetch tests."""

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
async def test_pib_ingestion_pipeline_integration(db_session: AsyncSession):
    html_content = load_fixture("pib_english_release.html").encode("utf-8")
    url = "https://pib.gov.in/PressReleasePage.aspx?PRID=2085000"

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

        # Verify Resource
        stmt_res = select(Resource).where(Resource.id == result.resource_id)
        res_obj = (await db_session.execute(stmt_res)).scalar_one_or_none()
        assert res_obj is not None
        assert res_obj.title == "Smart India Hackathon 2024 Concludes with Innovative Solutions"

        # Verify Document
        stmt_doc = select(Document).where(Document.id == result.document_id)
        doc_obj = (await db_session.execute(stmt_doc)).scalar_one_or_none()
        assert doc_obj is not None
        assert doc_obj.extraction_method == "PIB_ADAPTER"
        assert doc_obj.meta_info.get("ministry") == "Ministry of Education"

        # Verify Chunks
        stmt_chunks = select(Chunk).where(Chunk.document_id == result.document_id)
        chunks = (await db_session.execute(stmt_chunks)).scalars().all()
        assert len(chunks) == result.chunks_count
        for chk in chunks:
            assert "PIB Home" not in chk.content


@pytest.mark.asyncio
async def test_pib_duplicate_ingestion(db_session: AsyncSession):
    html_content = load_fixture("pib_english_release.html").encode("utf-8")
    url = "https://pib.gov.in/PressReleasePage.aspx?PRID=2085000"

    transport = MockTransport(status_code=200, content=html_content)
    async with httpx.AsyncClient(transport=transport) as client:
        fetcher = HttpFetcher(allow_private_ips=True, client=client)
        pipeline = IngestionPipeline(fetcher=fetcher)
        adapter = adapter_registry.resolve_for_url(url)

        # 1. First run
        res1 = await pipeline.execute(url=url, adapter=adapter, db=db_session)
        assert res1.success is True
        assert res1.is_duplicate is False

        # 2. Second run
        res2 = await pipeline.execute(url=url, adapter=adapter, db=db_session)
        assert res2.success is True
        assert res2.is_duplicate is True
        assert res2.resource_id == res1.resource_id
        assert res2.document_id == res1.document_id
