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
from app.ingestion.parsers.pib_parser import PIBParser


class PIBAdapter(SourceAdapter):
    """
    Dedicated source adapter for Press Information Bureau (PIB) press releases.
    Processes government announcements, ministry releases, and official statements
    with high precision while removing web layout chrome, navigation, and tickers.
    """

    def __init__(self, parser: Optional[PIBParser] = None):
        self._parser = parser or PIBParser()

    @property
    def source_identifier(self) -> str:
        return "pib"

    @property
    def display_name(self) -> str:
        return "Press Information Bureau (PIB)"

    def can_handle(self, url: str) -> bool:
        """
        Determines if the given URL belongs to the official PIB domain.
        Strictly matches official PIB hostnames (e.g. pib.gov.in, pib.nic.in)
        and rejects third-party, subverted, or unrelated domains.
        """
        if not url or not (url.startswith("http://") or url.startswith("https://")):
            return False

        try:
            parsed = urllib.parse.urlparse(url)
            hostname = (parsed.hostname or "").lower()
            if not hostname:
                return False

            valid_pib_domains = ("pib.gov.in", "pib.nic.in")
            return any(
                hostname == domain or hostname.endswith("." + domain)
                for domain in valid_pib_domains
            )
        except Exception:
            return False

    async def fetch(self, url: str, fetcher: HttpFetcher) -> FetchResponse:
        """Fetches the PIB press release through the standard guarded HttpFetcher."""
        return await fetcher.fetch(url)

    async def parse(self, fetch_response: FetchResponse) -> ParsedContent:
        """Parses the fetched PIB response using the dedicated PIBParser."""
        return self._parser.parse(fetch_response)

    async def normalize(
        self,
        parsed: ParsedContent,
        source_id: Optional[str] = None,
    ) -> NormalizedIngestionItem:
        """
        Normalizes parsed PIB content into a standard persistence-ready item.
        Computes SHA-256 content hash and formats metadata.
        """
        clean_text = TextNormalizer.normalize(parsed.text)
        content_hash = TextNormalizer.compute_hash(clean_text)

        title = parsed.title.strip() or "PIB Press Release"
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
