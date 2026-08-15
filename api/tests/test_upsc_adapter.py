from datetime import datetime
from pathlib import Path
import httpx
import pytest
from httpx import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.adapters.upsc_adapter import UPSCAdapter
from app.ingestion.contracts.models import FetchResponse
from app.ingestion.core.pipeline import IngestionPipeline
from app.ingestion.core.registry import adapter_registry
from app.ingestion.fetchers.http_fetcher import HttpFetcher
from app.ingestion.parsers.upsc_parser import UPSCParser, parse_upsc_date, detect_language
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.resource import Resource


FIXTURES_DIR = Path(__file__).parent / "fixtures" / "upsc"


def load_fixture(filename: str) -> str:
    with open(FIXTURES_DIR / filename, "r", encoding="utf-8") as f:
        return f.read()


# 1. UPSC URL detection
def test_upsc_url_detection():
    adapter = UPSCAdapter()
    valid_urls = [
        "https://upsc.gov.in/",
        "https://www.upsc.gov.in/examinations/active-exams",
        "https://upsc.gov.in/examinations/previous-question-papers",
        "https://upsc.gov.in/examinations/examination-calendar",
        "https://upsc.gov.in/whats-new",
        "https://upsconline.nic.in/mainmenu2.php",
        "https://www.upsconline.nic.in/ora/Registration",
        "http://upsc.gov.in/recruitment/recruitment-advertisement",
    ]
    for url in valid_urls:
        assert adapter.can_handle(url) is True, f"Failed to detect valid UPSC URL: {url}"


# 2. Non-UPSC URL rejection
def test_non_upsc_url_rejection():
    adapter = UPSCAdapter()
    invalid_urls = [
        "https://pib.gov.in/PressReleasePage.aspx?PRID=2085000",
        "https://www.isro.gov.in/",
        "https://example.com/upsc.gov.in",
        "https://upsc.gov.in.attacker.com/exam",
        "https://notupsc.gov.in/page",
        "file:///etc/passwd",
        "http://localhost:3000",
        "",
        "invalid-url",
    ]
    for url in invalid_urls:
        assert adapter.can_handle(url) is False, f"Failed to reject non-UPSC URL: {url}"


# 3. Title extraction
def test_upsc_title_extraction():
    parser = UPSCParser()
    html_content = load_fixture("upsc_active_exams.html")
    fetch_resp = FetchResponse(
        url="https://upsc.gov.in/examinations/active-exams",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    assert parsed.title == "Active Examinations"


# 4. Publication date extraction
def test_upsc_publication_date_extraction():
    parser = UPSCParser()
    html_content = load_fixture("upsc_exam_notice.html")
    fetch_resp = FetchResponse(
        url="https://upsc.gov.in/whats-new/notice-csp-2024",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    assert parsed.published_at == datetime(2024, 3, 19)


# 5. Examination name extraction
def test_upsc_examination_name_extraction():
    parser = UPSCParser()
    html_content = load_fixture("upsc_active_exams.html")
    fetch_resp = FetchResponse(
        url="https://upsc.gov.in/examinations/active-exams",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    assert "Civil Services (Preliminary) Examination, 2024" in parsed.text
    assert parsed.metadata.get("examination") is not None
    assert "Civil Services" in parsed.metadata.get("examination")


# 6. Category / notice extraction
def test_upsc_category_and_notice_extraction():
    parser = UPSCParser()
    html_content = load_fixture("upsc_prev_papers.html")
    fetch_resp = FetchResponse(
        url="https://upsc.gov.in/examinations/previous-question-papers",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    assert parsed.metadata.get("category") == "Previous Question Papers"
    assert parsed.metadata.get("document_type") == "QUESTION_PAPERS"


# 7. Main content extraction
def test_upsc_main_content_extraction():
    parser = UPSCParser()
    html_content = load_fixture("upsc_active_exams.html")
    fetch_resp = FetchResponse(
        url="https://upsc.gov.in/examinations/active-exams",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    text = parsed.text

    assert "Civil Services (Preliminary) Examination, 2024" in text
    assert "14/02/2024" in text
    assert "26/05/2024" in text
    assert "National Defence Academy and Naval Academy Examination (I), 2024" in text
    assert "Engineering Services (Preliminary) Examination, 2024" in text


# 8. Navigation removal
def test_upsc_navigation_removal():
    parser = UPSCParser()
    html_content = load_fixture("upsc_active_exams.html")
    fetch_resp = FetchResponse(
        url="https://upsc.gov.in/examinations/active-exams",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    text = parsed.text

    assert "About Us" not in text
    assert "Forms & Downloads" not in text
    assert "Skip to main content" not in text


# 9. Footer / sidebar removal
def test_upsc_footer_and_sidebar_removal():
    parser = UPSCParser()
    html_content = load_fixture("upsc_active_exams.html")
    fetch_resp = FetchResponse(
        url="https://upsc.gov.in/examinations/active-exams",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)
    text = parsed.text

    assert "Website Contents Provided and Maintained by" not in text
    assert "Designed, Developed and Hosted by National Informatics Centre" not in text
    assert "Exam Calendar" not in text  # from sidebar


# 10. Unicode preservation
def test_upsc_unicode_preservation():
    parser = UPSCParser()
    hindi_html = load_fixture("upsc_hindi_page.html")
    fetch_resp = FetchResponse(
        url="https://upsc.gov.in/hi/examinations/active-exams",
        status_code=200,
        content_type="text/html",
        text_content=hindi_html,
    )
    parsed = parser.parse(fetch_resp)

    assert "सक्रिय परीक्षाएं" in parsed.title
    assert "सिविल सेवा (प्रारंभिक) परीक्षा, 2024" in parsed.text
    assert "राष्ट्रीय रक्षा अकादमी तथा नौसेना अकादमी परीक्षा" in parsed.text
    assert parsed.language == "hi"


# 11. Malformed HTML handling
def test_upsc_malformed_html_handling():
    parser = UPSCParser()
    malformed_html = load_fixture("upsc_malformed.html")
    fetch_resp = FetchResponse(
        url="https://upsc.gov.in/examinations/cms-2024",
        status_code=200,
        content_type="text/html",
        text_content=malformed_html,
    )
    parsed = parser.parse(fetch_resp)

    assert "Malformed UPSC Page" in parsed.title
    assert "Combined Medical Services Examination, 2024" in parsed.text
    assert "10/04/2024" in parsed.text


# 12. Missing optional metadata
def test_upsc_missing_optional_metadata():
    parser = UPSCParser()
    minimal_html = load_fixture("upsc_minimal.html")
    fetch_resp = FetchResponse(
        url="https://upsc.gov.in/general/page",
        status_code=200,
        content_type="text/html",
        text_content=minimal_html,
    )
    parsed = parser.parse(fetch_resp)

    assert parsed.title == "Annual Examination Schedule"
    assert parsed.published_at is None
    assert "annual examination calendar for recruitment tests" in parsed.text
    assert parsed.metadata.get("pdf_links_count") == 0


# 13. Registry resolution
def test_upsc_adapter_registry_resolution():
    upsc_adapter = adapter_registry.resolve_for_url("https://upsc.gov.in/examinations/active-exams")
    assert upsc_adapter.source_identifier == "upsc"
    assert isinstance(upsc_adapter, UPSCAdapter)

    pib_adapter = adapter_registry.resolve_for_url("https://pib.gov.in/PressReleasePage.aspx?PRID=2085000")
    assert pib_adapter.source_identifier == "pib"

    generic_adapter = adapter_registry.resolve_for_url("https://www.isro.gov.in/")
    assert generic_adapter.source_identifier == "generic_http"


# 14. Normalized output
@pytest.mark.asyncio
async def test_upsc_normalized_output():
    adapter = UPSCAdapter()
    html_content = load_fixture("upsc_active_exams.html")
    fetch_resp = FetchResponse(
        url="https://upsc.gov.in/examinations/active-exams",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = await adapter.parse(fetch_resp)
    normalized = await adapter.normalize(parsed)

    assert normalized.source_identifier == "upsc"
    assert normalized.extraction_method == "UPSC_ADAPTER"
    assert normalized.content_type == "ARTICLE"
    assert len(normalized.content_hash) == 64
    assert normalized.meta_info.get("category") == "Active Examinations"
    assert normalized.meta_info.get("pdf_processing") == "DEFERRED"


# 15. Ingestion pipeline integration
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
async def test_upsc_ingestion_pipeline_integration(db_session: AsyncSession):
    html_content = load_fixture("upsc_active_exams.html").encode("utf-8")
    url = "https://upsc.gov.in/examinations/active-exams"

    transport = MockTransport(status_code=200, content=html_content)
    async with httpx.AsyncClient(transport=transport) as client:
        fetcher = HttpFetcher(allow_private_ips=True, client=client)
        pipeline = IngestionPipeline(fetcher=fetcher)
        adapter = adapter_registry.resolve_for_url(url)

        result = await pipeline.execute(
            url=url,
            adapter=adapter,
            db=db_session,
            chunk_size=200,
            chunk_overlap=30,
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
        assert res_obj.title == "Active Examinations"

        # Verify Document
        stmt_doc = select(Document).where(Document.id == result.document_id)
        doc_obj = (await db_session.execute(stmt_doc)).scalar_one_or_none()
        assert doc_obj is not None
        assert doc_obj.extraction_method == "UPSC_ADAPTER"
        assert doc_obj.meta_info.get("category") == "Active Examinations"
        assert doc_obj.meta_info.get("pdf_processing") == "DEFERRED"

        # Verify Chunks
        stmt_chunks = select(Chunk).where(Chunk.document_id == result.document_id)
        chunks = (await db_session.execute(stmt_chunks)).scalars().all()
        assert len(chunks) == result.chunks_count
        for chk in chunks:
            assert "About Us" not in chk.content


# 16. Deduplication
@pytest.mark.asyncio
async def test_upsc_duplicate_ingestion(db_session: AsyncSession):
    html_content = load_fixture("upsc_active_exams.html").encode("utf-8")
    url = "https://upsc.gov.in/examinations/active-exams"

    transport = MockTransport(status_code=200, content=html_content)
    async with httpx.AsyncClient(transport=transport) as client:
        fetcher = HttpFetcher(allow_private_ips=True, client=client)
        pipeline = IngestionPipeline(fetcher=fetcher)
        adapter = adapter_registry.resolve_for_url(url)

        # First run
        res1 = await pipeline.execute(url=url, adapter=adapter, db=db_session)
        assert res1.success is True
        assert res1.is_duplicate is False

        # Second run
        res2 = await pipeline.execute(url=url, adapter=adapter, db=db_session)
        assert res2.success is True
        assert res2.is_duplicate is True
        assert res2.resource_id == res1.resource_id
        assert res2.document_id == res1.document_id


# 17. PDF-link detection without PDF processing
def test_upsc_pdf_link_detection_without_processing():
    parser = UPSCParser()
    html_content = load_fixture("upsc_active_exams.html")
    fetch_resp = FetchResponse(
        url="https://upsc.gov.in/examinations/active-exams",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )
    parsed = parser.parse(fetch_resp)

    pdf_links = parsed.metadata.get("pdf_links", [])
    assert len(pdf_links) == 3
    assert parsed.metadata.get("pdf_links_count") == 3
    assert parsed.metadata.get("pdf_processing") == "DEFERRED"

    # Verify URLs are resolved properly to full absolute URLs
    urls = [p["url"] for p in pdf_links]
    assert "https://upsc.gov.in/sites/default/files/Notice-CSP-2024-engl-140224.pdf" in urls
    assert "https://upsc.gov.in/sites/default/files/Notice-NDA-NA-I-2024-engl.pdf" in urls
    assert "https://upsc.gov.in/sites/default/files/Notice-ESE-2024-engl.pdf" in urls
