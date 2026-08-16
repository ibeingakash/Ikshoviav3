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
from app.ingestion.parsers.isro_parser import ISROParser


class ISROAdapter(SourceAdapter):
    """
    Dedicated source adapter for Indian Space Research Organisation (ISRO).
    Extracts lunar/interplanetary missions, launch vehicle milestones, satellite specs,
    Earth observation data summaries, and national space research developments.
    """

    def __init__(self, parser: Optional[ISROParser] = None):
        self._parser = parser or ISROParser()

    @property
    def source_identifier(self) -> str:
        return "isro"

    @property
    def display_name(self) -> str:
        return "Indian Space Research Organisation (ISRO)"

    def can_handle(self, url: str) -> bool:
        """
        Determines if the URL belongs to official ISRO domains (isro.gov.in, isro.nic.in).
        """
        if not url or not (url.startswith("http://") or url.startswith("https://")):
            return False

        try:
            parsed = urllib.parse.urlparse(url)
            hostname = (parsed.hostname or "").lower()
            if not hostname:
                return False

            valid_isro_domains = ("isro.gov.in", "isro.nic.in")
            return any(
                hostname == domain or hostname.endswith("." + domain)
                for domain in valid_isro_domains
            )
        except Exception:
            return False

    async def fetch(self, url: str, fetcher: HttpFetcher) -> FetchResponse:
        """Fetches the official ISRO webpage through guarded HttpFetcher."""
        return await fetcher.fetch(url)

    async def parse(self, fetch_response: FetchResponse) -> ParsedContent:
        """Parses the fetched response using the dedicated ISROParser."""
        return self._parser.parse(fetch_response)

    async def normalize(
        self,
        parsed: ParsedContent,
        source_id: Optional[str] = None,
    ) -> NormalizedIngestionItem:
        """
        Normalizes parsed ISRO content into a standard persistence-ready item.
        Computes SHA-256 content hash and formats metadata.
        """
        clean_text = TextNormalizer.normalize(parsed.text)
        content_hash = TextNormalizer.compute_hash(clean_text)

        title = parsed.title.strip() or "ISRO Space Document"
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
