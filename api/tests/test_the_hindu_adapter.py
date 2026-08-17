import pytest
from datetime import datetime
from app.ingestion.adapters.the_hindu_adapter import TheHinduAdapter
from app.ingestion.contracts.models import FetchResponse
from app.ingestion.core.registry import AdapterRegistry


def test_the_hindu_url_detection():
    adapter = TheHinduAdapter()
    assert adapter.can_handle("https://www.thehindu.com/opinion/editorial/sub-classification-sc-st-verdict/article68541234.ece")
    assert adapter.can_handle("https://thehindu.com/news/national/isro-sslv-d3-launch-success/article68545678.ece")
    assert adapter.can_handle("https://thg.in/article-short-link")
    assert not adapter.can_handle("https://pib.gov.in/PressReleasePage.aspx?PRID=123")
    assert not adapter.can_handle("https://indianexpress.com/article/explained/")


def test_the_hindu_editorial_parsing():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Balancing affirmative action: On SC/ST sub-classification - The Hindu</title>
        <meta property="og:title" content="Balancing affirmative action: On SC/ST sub-classification" />
        <meta property="og:description" content="The Supreme Court verdict allowing sub-classification balances social justice with constitutional discipline." />
        <meta property="article:published_time" content="2026-08-17T04:30:00+05:30" />
        <meta property="article:section" content="Editorial" />
        <meta name="author" content="The Hindu Editorial Desk" />
    </head>
    <body>
        <div class="nav-header">Header Menu</div>
        <h1>Balancing affirmative action: On SC/ST sub-classification</h1>
        <h2 class="sub-title">The Supreme Court verdict balances social justice with empirical rigor</h2>
        <div class="byline">By The Hindu Editorial Desk | Updated August 17, 2026 08:30 IST</div>
        <div class="articlebody">
            <p>The landmark 7-judge Constitution Bench ruling permitting the sub-classification of Scheduled Castes for the purpose of affirmative action marks a pivotal evolution in constitutional jurisprudence.</p>
            <p>By overruling the earlier 2004 E.V. Chinnaiah judgment, the apex court recognized that backwardness is not uniform across all constituent sub-castes.</p>
            <p>Crucially, the Court has circumscribed state power by demanding that any quota sub-categorization must be backed by empirical, verifiable quantifiable data rather than political expediency.</p>
            <p>Going forward, states must establish transparent commissions to prevent arbitrary exclusions and preserve institutional cohesion.</p>
        </div>
        <div class="dfp-ad">Ad Banner</div>
        <div class="footer">All rights reserved</div>
    </body>
    </html>
    """

    adapter = TheHinduAdapter()
    fetch_resp = FetchResponse(
        url="https://www.thehindu.com/opinion/editorial/sub-classification-sc-st-verdict/article68541234.ece",
        status_code=200,
        content_type="text/html",
        text_content=html_content,
    )

    parsed = adapter._parser.parse(fetch_resp)
    assert "Balancing affirmative action" in parsed.title
    assert parsed.metadata["article_type"] == "EDITORIAL"
    assert parsed.metadata["source_name"] == "The Hindu"
    assert len(parsed.text) > 150
    assert "landmark 7-judge Constitution Bench" in parsed.text
    assert "Ad Banner" not in parsed.text
    assert "Header Menu" not in parsed.text


@pytest.mark.asyncio
async def test_the_hindu_adapter_normalization():
    adapter = TheHinduAdapter()
    fetch_resp = FetchResponse(
        url="https://www.thehindu.com/opinion/editorial/sub-classification-sc-st-verdict/article68541234.ece",
        status_code=200,
        content_type="text/html",
        text_content="""
        <html>
        <head><title>Trade Resilience and Tariff Volatility - The Hindu</title></head>
        <body>
        <h1>Trade Resilience and Tariff Volatility</h1>
        <p>India's merchandise trade dynamics demand export diversification across global value chains.</p>
        <p>Policy interventions must enhance cost competitiveness and logistics efficiency.</p>
        </body>
        </html>
        """,
    )

    parsed = await adapter.parse(fetch_resp)
    normalized = await adapter.normalize(parsed, source_id="src_hindu_test")

    assert normalized.source_identifier == "the_hindu"
    assert normalized.source_id == "src_hindu_test"
    assert normalized.title == "Trade Resilience and Tariff Volatility"
    assert len(normalized.content_hash) == 64
    assert normalized.content_type in ("EDITORIAL", "NEWS")


def test_the_hindu_registry_resolution():
    registry = AdapterRegistry()
    adapter = registry.resolve_for_url("https://www.thehindu.com/opinion/editorial/sample-article")
    assert isinstance(adapter, TheHinduAdapter)
    assert adapter.source_identifier == "the_hindu"
