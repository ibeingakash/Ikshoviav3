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
from app.ingestion.parsers.rbi_parser import RBIParser


class RBIAdapter(SourceAdapter):
    """
    Dedicated source adapter for Reserve Bank of India (RBI) official content.
    Extracts monetary policy decisions, circulars, notifications, banking guidelines,
    financial stability reports, and regulatory frameworks.
    """

    def __init__(self, parser: Optional[RBIParser] = None):
        self._parser = parser or RBIParser()

    @property
    def source_identifier(self) -> str:
        return "rbi"

    @property
    def display_name(self) -> str:
        return "Reserve Bank of India (RBI)"

    def can_handle(self, url: str) -> bool:
        """
        Determines if the URL belongs to official RBI domains (rbi.org.in, rbidocs.rbi.org.in, m.rbi.org.in).
        """
        if not url or not (url.startswith("http://") or url.startswith("https://")):
            return False

        try:
            parsed = urllib.parse.urlparse(url)
            hostname = (parsed.hostname or "").lower()
            if not hostname:
                return False

            valid_rbi_domains = ("rbi.org.in", "rbidocs.rbi.org.in")
            return any(
                hostname == domain or hostname.endswith("." + domain)
                for domain in valid_rbi_domains
            )
        except Exception:
            return False

    async def fetch(self, url: str, fetcher: HttpFetcher) -> FetchResponse:
        """Fetches the official RBI webpage through guarded HttpFetcher."""
        return await fetcher.fetch(url)

    async def parse(self, fetch_response: FetchResponse) -> ParsedContent:
        """Parses the fetched response using the dedicated RBIParser."""
        return self._parser.parse(fetch_response)

    async def normalize(
        self,
        parsed: ParsedContent,
        source_id: Optional[str] = None,
    ) -> NormalizedIngestionItem:
        """
        Normalizes parsed RBI content into a standard persistence-ready item.
        Computes SHA-256 content hash and formats metadata.
        """
        clean_text = TextNormalizer.normalize(parsed.text)
        content_hash = TextNormalizer.compute_hash(clean_text)

        title = parsed.title.strip() or "Reserve Bank of India Document"
        if len(title) > 500:
            title = title[:497] + "..."

        return NormalizedIngestionItem(
            source_identifier=self.source_identifier,
            source_id=source_id,
            title=title,
            url=parsed.url,
            content=clean_text,
            content_type="ARTICLE",
            description=parsed.description,
            published_at=parsed.published_at,
            content_hash=content_hash,
            language=parsed.language,
            mime_type=parsed.mime_type,
            extraction_method=parsed.extraction_method,
            quality_score=1.0,
            meta_info=parsed.metadata,
        )
