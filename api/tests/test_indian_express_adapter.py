import pytest
from app.ingestion.adapters.indian_express_adapter import IndianExpressAdapter
from app.ingestion.contracts.models import FetchResponse
from app.ingestion.core.registry import AdapterRegistry


def test_indian_express_url_detection():
    adapter = IndianExpressAdapter()
    assert adapter.can_handle("https://indianexpress.com/article/explained/sc-st-sub-classification-explained-supreme-court-verdict-9512345/")
    assert adapter.can_handle("https://www.indianexpress.com/article/opinion/editorials/quota-and-data-9512999/")
    assert adapter.can_handle("https://ieonline.com/article/short-url")
    assert not adapter.can_handle("https://www.thehindu.com/news/")
    assert not adapter.can_handle("https://rbi.org.in/press_releases")


def test_indian_express_explained_parsing():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Explained: How SC/ST Sub-Categorization Changes the Affirmative Action Matrix | The Indian Express</title>
        <meta property="og:title" content="Explained: How SC/ST Sub-Categorization Changes Affirmative Action" />
        <meta property="og:description" content="A comprehensive analysis of Article 341, the 2004 Chinnaiah ruling, and the 2024 Constitution Bench judgment." />
        <meta property="article:published_time" content="2026-08-17T06:00:00+05:30" />
        <meta property="article:section" content="Explained" />
        <meta name="author" content="Express News Service" />
    </head>
    <body>
        <div class="nav">Nav Bar</div>
        <h1>Explained: How SC/ST Sub-Categorization Changes Affirmative Action</h1>
        <h2 class="synopsis">The historical context of affirmative action quotas and state legislative competence</h2>
        <div class="byline">Written by Express News Service | New Delhi | August 17, 2026 07:45 IST</div>
        <div class="story-details">
            <p>The Supreme Court on Thursday delivered a landmark verdict upholding the constitutional power of States to sub-classify Scheduled Castes and Scheduled Tribes to provide preferential reservation.</p>
            <p>Under Article 341 of the Constitution, the President notifies the list of Scheduled Castes for each State. The central legal query was whether state-level sub-quotas violate this presidential designation.</p>
            <p>The majority held that sub-classification does not tinker with or amend the Presidential list itself, but rather targets unequal distribution within the protected class.</p>
            <p>Crucially, the Court stipulated that States must collect empirical quantifiable data demonstrating inadequate representation before implementing sub-classification.</p>
        </div>
        <div class="ie-ad">Advertisement</div>
        <div class="footer">Copyright The Indian Express</div>
    </body>
    </html>
    """

    adapter = IndianExpressAdapter()
    fetch_resp = FetchResponse(
        url="https://indianexpress.com/article/explained/sc-st-sub-classification-explained-supreme-court-verdict-9512345/",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )

    parsed = adapter._parser.parse(fetch_resp)
    assert "Explained: How SC/ST Sub-Categorization" in parsed.title
    assert parsed.metadata["article_type"] == "EXPLAINER"
    assert parsed.metadata["source_name"] == "The Indian Express"
    assert "Article 341 of the Constitution" in parsed.text
    assert "Advertisement" not in parsed.text
    assert "Nav Bar" not in parsed.text


@pytest.mark.asyncio
async def test_indian_express_adapter_normalization():
    adapter = IndianExpressAdapter()
    fetch_resp = FetchResponse(
        url="https://indianexpress.com/article/explained/sslv-d3-launch-isro-significance-9513344/",
        status_code=200,
        content_type="text/html",
        text_content="""
        <html>
        <head><title>Explained: Why SSLV-D3 Flight is Crucial for India's Commercial Space Market</title></head>
        <body>
        <h1>Explained: Why SSLV-D3 Flight is Crucial for India's Commercial Space Market</h1>
        <p>ISRO completed the developmental phase of the Small Satellite Launch Vehicle (SSLV).</p>
        <p>This transition opens private industry technology transfers via NewSpace India Limited (NSIL).</p>
        </body>
        </html>
        """,
    )

    parsed = await adapter.parse(fetch_resp)
    normalized = await adapter.normalize(parsed, source_id="src_ie_test")

    assert normalized.source_identifier == "indian_express"
    assert normalized.source_id == "src_ie_test"
    assert "SSLV-D3 Flight" in normalized.title
    assert len(normalized.content_hash) == 64
    assert normalized.content_type in ("EXPLAINER", "NEWS")


def test_indian_express_registry_resolution():
    registry = AdapterRegistry()
    adapter = registry.resolve_for_url("https://indianexpress.com/article/explained/sample-article")
    assert isinstance(adapter, IndianExpressAdapter)
    assert adapter.source_identifier == "indian_express"
