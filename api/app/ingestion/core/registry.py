from typing import Dict, List, Optional
from app.ingestion.adapters.dst_adapter import DSTAdapter
from app.ingestion.adapters.indiagov_adapter import IndiaGovAdapter
from app.ingestion.adapters.indian_express_adapter import IndianExpressAdapter
from app.ingestion.adapters.isro_adapter import ISROAdapter
from app.ingestion.adapters.moefcc_adapter import MoEFCCAdapter
from app.ingestion.adapters.niti_adapter import NITIAdapter
from app.ingestion.adapters.pib_adapter import PIBAdapter
from app.ingestion.adapters.rbi_adapter import RBIAdapter
from app.ingestion.adapters.the_hindu_adapter import TheHinduAdapter
from app.ingestion.adapters.upsc_adapter import UPSCAdapter
from app.ingestion.contracts.models import (
    FetchResponse,
    NormalizedIngestionItem,
    ParsedContent,
)
from app.ingestion.contracts.source_adapter import SourceAdapter
from app.ingestion.fetchers.http_fetcher import HttpFetcher
from app.ingestion.normalizers.text_normalizer import TextNormalizer
from app.ingestion.parsers.base_parser import GenericTextParser


class GenericHttpAdapter(SourceAdapter):
    """
    Standard generic HTTP/HTTPS adapter for permitted public web content.
    Serves as the default fallback adapter for testing and general ingestion.
    """

    def __init__(self, parser: Optional[GenericTextParser] = None):
        self._parser = parser or GenericTextParser()

    @property
    def source_identifier(self) -> str:
        return "generic_http"

    @property
    def display_name(self) -> str:
        return "Generic Public Web Resource"

    def can_handle(self, url: str) -> bool:
        # Fallback adapter that handles any standard HTTP/HTTPS public URL
        return url.startswith("http://") or url.startswith("https://")

    async def fetch(self, url: str, fetcher: HttpFetcher) -> FetchResponse:
        return await fetcher.fetch(url)

    async def parse(self, fetch_response: FetchResponse) -> ParsedContent:
        return self._parser.parse(fetch_response)

    async def normalize(
        self,
        parsed: ParsedContent,
        source_id: Optional[str] = None,
    ) -> NormalizedIngestionItem:
        clean_text = TextNormalizer.normalize(parsed.text)
        content_hash = TextNormalizer.compute_hash(clean_text)

        title = parsed.title.strip() or "Untitled Document"
        # Truncate title if longer than 500 chars to fit database schema
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


class AdapterRegistry:
    """
    Registry for source adapters.
    
    Allows dynamic registration of domain-specific adapters (PIB, UPSC, RBI, NITI,
    MoEFCC, DST, ISRO, IndiaGov) while keeping the core ingestion engine clean.
    """

    def __init__(self):
        self._adapters: Dict[str, SourceAdapter] = {}
        self._fallback_adapter = GenericHttpAdapter()
        # Register default fallback adapter
        self.register(self._fallback_adapter)
        # Register domain-specific official government & institutional adapters
        self.register(PIBAdapter())
        self.register(UPSCAdapter())
        self.register(RBIAdapter())
        self.register(NITIAdapter())
        self.register(MoEFCCAdapter())
        self.register(DSTAdapter())
        self.register(ISROAdapter())
        self.register(IndiaGovAdapter())
        # Register verified newspaper intelligence adapters
        self.register(TheHinduAdapter())
        self.register(IndianExpressAdapter())

    def register(self, adapter: SourceAdapter) -> None:
        """Registers a source adapter."""
        self._adapters[adapter.source_identifier] = adapter

    def unregister(self, source_identifier: str) -> None:
        """Removes a source adapter by its identifier."""
        if source_identifier in self._adapters:
            del self._adapters[source_identifier]

    def get(self, source_identifier: str) -> Optional[SourceAdapter]:
        """Retrieves an adapter by identifier."""
        return self._adapters.get(source_identifier)

    def resolve_for_url(self, url: str) -> SourceAdapter:
        """
        Resolves the most specific matching adapter for a URL.
        Iterates registered domain adapters in reverse registration order (newest first),
        and falls back to generic HTTP.
        """
        for adapter in reversed(list(self._adapters.values())):
            if adapter.source_identifier != "generic_http" and adapter.can_handle(url):
                return adapter

        return self._fallback_adapter

    def list_adapters(self) -> List[str]:
        """Returns a list of all registered adapter identifiers."""
        return list(self._adapters.keys())


# Global singleton registry instance
adapter_registry = AdapterRegistry()
