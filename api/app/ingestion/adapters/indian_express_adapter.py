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
from app.ingestion.parsers.indian_express_parser import IndianExpressParser


class IndianExpressAdapter(SourceAdapter):
    """
    Dedicated source adapter for The Indian Express (Explained, Editorials, UPSC Essentials).
    Extracts high-yield analysis while isolating commentary and maintaining provenance.
    """

    def __init__(self, parser: Optional[IndianExpressParser] = None):
        self._parser = parser or IndianExpressParser()

    @property
    def source_identifier(self) -> str:
        return "indian_express"

    @property
    def display_name(self) -> str:
        return "The Indian Express"

    def can_handle(self, url: str) -> bool:
        """
        Determines if the URL belongs to Indian Express verified domains.
        """
        if not url or not (url.startswith("http://") or url.startswith("https://")):
            return False

        try:
            parsed = urllib.parse.urlparse(url)
            hostname = (parsed.hostname or "").lower()
            if not hostname:
                return False

            valid_domains = ("indianexpress.com", "ieonline.com")
            return any(
                hostname == domain or hostname.endswith("." + domain)
                for domain in valid_domains
            )
        except Exception:
            return False

    async def fetch(self, url: str, fetcher: HttpFetcher) -> FetchResponse:
        """Fetches the Indian Express article via guarded HttpFetcher."""
        return await fetcher.fetch(url)

    async def parse(self, fetch_response: FetchResponse) -> ParsedContent:
        """Parses the response using IndianExpressParser."""
        return self._parser.parse(fetch_response)

    async def normalize(
        self,
        parsed: ParsedContent,
        source_id: Optional[str] = None,
    ) -> NormalizedIngestionItem:
        """
        Normalizes parsed content into standard item format with SHA-256 hash.
        """
        clean_text = TextNormalizer.normalize(parsed.text)
        content_hash = TextNormalizer.compute_hash(clean_text)

        title = parsed.title.strip() or "Indian Express Article"
        if len(title) > 500:
            title = title[:497] + "..."

        article_type = parsed.metadata.get("article_type", "EXPLAINER")

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
