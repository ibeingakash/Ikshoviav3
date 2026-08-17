import urllib.parse
from typing import Optional

from app.ingestion.contracts.models import (
    FetchResponse,
    NormalizedIngestionItem,
    ParsedContent,
)
from app.ingestion.contracts.source_adapter import SourceAdapter
from app.ingestion.fetchers.http_fetcher import HttpFetcher
from app.ingestion.normalizers.text_normalizer import TextNormalizer
from app.ingestion.parsers.the_hindu_parser import TheHinduParser


class TheHinduAdapter(SourceAdapter):
    """
    Dedicated source adapter for The Hindu newspaper intelligence.
    Extracts public and permitted editorial, analysis, and news content
    while properly isolating opinion and preserving canonical links.
    """

    def __init__(self, parser: Optional[TheHinduParser] = None):
        self._parser = parser or TheHinduParser()

    @property
    def source_identifier(self) -> str:
        return "the_hindu"

    @property
    def display_name(self) -> str:
        return "The Hindu"

    def can_handle(self, url: str) -> bool:
        """
        Determines if the URL belongs to The Hindu's verified news domains.
        """
        if not url or not (url.startswith("http://") or url.startswith("https://")):
            return False

        try:
            parsed = urllib.parse.urlparse(url)
            hostname = (parsed.hostname or "").lower()
            if not hostname:
                return False

            valid_domains = ("thehindu.com", "thg.in")
            return any(
                hostname == domain or hostname.endswith("." + domain)
                for domain in valid_domains
            )
        except Exception:
            return False

    async def fetch(self, url: str, fetcher: HttpFetcher) -> FetchResponse:
        """Fetches The Hindu article via guarded HttpFetcher."""
        return await fetcher.fetch(url)

    async def parse(self, fetch_response: FetchResponse) -> ParsedContent:
        """Parses The Hindu content using the dedicated TheHinduParser."""
        return self._parser.parse(fetch_response)

    async def normalize(
        self,
        parsed: ParsedContent,
        source_id: Optional[str] = None,
    ) -> NormalizedIngestionItem:
        """
        Normalizes parsed content into standardized ingestion schema.
        Calculates SHA-256 content hash and attaches editorial intelligence tags.
        """
        clean_text = TextNormalizer.normalize(parsed.text)
        content_hash = TextNormalizer.compute_hash(clean_text)

        title = parsed.title.strip() or "The Hindu Article"
        if len(title) > 500:
            title = title[:497] + "..."

        article_type = parsed.metadata.get("article_type", "NEWS")

        return NormalizedIngestionItem(
            source_identifier=self.source_identifier,
            source_id=source_id,
            title=title,
            url=parsed.url,
            content=clean_text,
            content_type=article_type,
            description=parsed.description,
            published_at=parsed.published_at,
            content_hash=content_hash,
            language=parsed.language,
            mime_type=parsed.mime_type,
            extraction_method=parsed.extraction_method,
            quality_score=0.95,
            meta_info=parsed.metadata,
        )
