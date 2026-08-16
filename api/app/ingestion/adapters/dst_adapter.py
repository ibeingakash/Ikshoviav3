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
from app.ingestion.parsers.dst_parser import DSTParser


class DSTAdapter(SourceAdapter):
    """
    Dedicated source adapter for Department of Science and Technology (DST),
    Ministry of Science & Technology, Government of India.
    Extracts National Quantum Mission updates, scientific fellowships, Mega Science initiatives,
    and technological innovation roadmaps.
    """

    def __init__(self, parser: Optional[DSTParser] = None):
        self._parser = parser or DSTParser()

    @property
    def source_identifier(self) -> str:
        return "dst"

    @property
    def display_name(self) -> str:
        return "Department of Science and Technology (DST)"

    def can_handle(self, url: str) -> bool:
        """
        Determines if the URL belongs to official DST domains (dst.gov.in, online-dst.gov.in).
        """
        if not url or not (url.startswith("http://") or url.startswith("https://")):
            return False

        try:
            parsed = urllib.parse.urlparse(url)
            hostname = (parsed.hostname or "").lower()
            if not hostname:
                return False

            valid_dst_domains = ("dst.gov.in", "online-dst.gov.in")
            return any(
                hostname == domain or hostname.endswith("." + domain)
                for domain in valid_dst_domains
            )
        except Exception:
            return False

    async def fetch(self, url: str, fetcher: HttpFetcher) -> FetchResponse:
        """Fetches the official DST webpage through guarded HttpFetcher."""
        return await fetcher.fetch(url)

    async def parse(self, fetch_response: FetchResponse) -> ParsedContent:
        """Parses the fetched response using the dedicated DSTParser."""
        return self._parser.parse(fetch_response)

    async def normalize(
        self,
        parsed: ParsedContent,
        source_id: Optional[str] = None,
    ) -> NormalizedIngestionItem:
        """
        Normalizes parsed DST content into a standard persistence-ready item.
        Computes SHA-256 content hash and formats metadata.
        """
        clean_text = TextNormalizer.normalize(parsed.text)
        content_hash = TextNormalizer.compute_hash(clean_text)

        title = parsed.title.strip() or "DST Scientific Document"
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
