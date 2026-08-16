from datetime import datetime
from pathlib import Path
import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.adapters.isro_adapter import ISROAdapter
from app.ingestion.contracts.models import FetchResponse
from app.ingestion.core.pipeline import IngestionPipeline
from app.ingestion.core.registry import adapter_registry
from app.ingestion.fetchers.http_fetcher import HttpFetcher
from app.ingestion.parsers.isro_parser import ISROParser
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.resource import Resource


FIXTURES_DIR = Path(__file__).parent / "fixtures" / "isro"


def load_fixture(filename: str) -> str:
    with open(FIXTURES_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()


def test_isro_url_detection():
    adapter = ISROAdapter()
    valid_urls = [
        "https://www.isro.gov.in/Chandrayaan3.html",
        "https://isro.gov.in/Gaganyaan.html",
        "https://isro.nic.in/missions",
    ]
    for url in valid_urls:
        assert adapter.can_handle(url) is True, f"Failed to detect valid ISRO URL: {url}"


def test_non_isro_url_rejection():
    adapter = ISROAdapter()
    invalid_urls = [
        "https://pib.gov.in",
        "https://rbi.org.in",
        "https://example.com/isro.gov.in",
        "file:///etc/passwd",
        "",
    ]
    for url in invalid_urls:
        assert adapter.can_handle(url) is False, f"Failed to reject non-ISRO URL: {url}"


def test_isro_mission_parsing():
    parser = ISROParser()
    html_content = load_fixture("isro_mission.html")
    fetch_resp = FetchResponse(
        url="https://www.isro.gov.in/chandrayaan-3",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "Chandrayaan-3" in parsed.title
    assert parsed.published_at == datetime(2023, 7, 14)
    assert parsed.metadata.get("launch_vehicle") == "LVM3-M4"
    assert "Vikram" in parsed.text
    assert "Pragyan" in parsed.text
    assert "ChASTE" in parsed.text

    pdf_links = parsed.metadata.get("pdf_links", [])
    assert len(pdf_links) == 1
    assert "chandrayaan3_brochure.pdf" in pdf_links[0]["url"]


def test_isro_hindi_parsing():
    parser = ISROParser()
    html_content = load_fixture("isro_hindi.html")
    fetch_resp = FetchResponse(
        url="https://www.isro.gov.in/hi/gaganyaan",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "गगनयान: भारत का प्रथम मानवयुक्त अंतरिक्ष मिशन" in parsed.title
    assert parsed.language == "hi"
    assert parsed.published_at == datetime(2024, 1, 15)
    assert "मानव अंतरिक्ष उड़ान क्षमता" in parsed.text


def test_isro_malformed_html_handling():
    parser = ISROParser()
    html_content = load_fixture("isro_malformed.html")
    fetch_resp = FetchResponse(
        url="https://isro.gov.in/aditya-l1",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    assert "Aditya-L1 Solar Observatory Mission" in parsed.title
    assert "Lagrange point" in parsed.text


@pytest.mark.asyncio
async def test_isro_adapter_normalization():
    adapter = ISROAdapter()
    html_content = load_fixture("isro_mission.html")
    fetch_resp = FetchResponse(
        url="https://www.isro.gov.in/chandrayaan-3",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = await adapter.parse(fetch_resp)
    normalized = await adapter.normalize(parsed)

    assert normalized.source_identifier == "isro"
    assert normalized.extraction_method == "ISRO_ADAPTER"
    assert normalized.content_type == "ARTICLE"
    assert len(normalized.content_hash) == 64


def test_isro_adapter_registry_resolution():
    url = "https://www.isro.gov.in/chandrayaan3_details.html"
    resolved = adapter_registry.resolve_for_url(url)
    assert resolved.source_identifier == "isro"
    assert isinstance(resolved, ISROAdapter)


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
async def test_isro_ingestion_pipeline(db_session: AsyncSession):
    html_content = load_fixture("isro_mission.html").encode("utf-8")
    url = "https://www.isro.gov.in/missions/chandrayaan-3"

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
        assert doc.extraction_method == "ISRO_ADAPTER"
        assert doc.meta_info.get("launch_vehicle") == "LVM3-M4"
