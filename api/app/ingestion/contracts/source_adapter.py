from abc import ABC, abstractmethod
from typing import Optional, TYPE_CHECKING
from app.ingestion.contracts.models import (
    FetchResponse,
    NormalizedIngestionItem,
    ParsedContent,
)

if TYPE_CHECKING:
    from app.ingestion.fetchers.http_fetcher import HttpFetcher


class SourceAdapter(ABC):
    """
    Abstract contract for source adapters.
    
    Any future source (e.g. PIB, UPSC, Gazettes, Reports, Open APIs) implements
    this contract without requiring modifications to the core worker or pipeline.
    """

    @property
    @abstractmethod
    def source_identifier(self) -> str:
        """Unique machine-readable identifier for the source adapter."""
        pass

    @property
    def display_name(self) -> str:
        """Human-readable display name for the source."""
        return self.source_identifier.replace("_", " ").title()

    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """Determines if this adapter can process the given public URL."""
        pass

    @abstractmethod
    async def fetch(self, url: str, fetcher: "HttpFetcher") -> FetchResponse:
        """Fetches the raw content from the source using the provided HttpFetcher."""
        pass

    @abstractmethod
    async def parse(self, fetch_response: FetchResponse) -> ParsedContent:
        """Parses the raw fetch response into a structured intermediate representation."""
        pass

    @abstractmethod
    async def normalize(
        self,
        parsed: ParsedContent,
        source_id: Optional[str] = None,
    ) -> NormalizedIngestionItem:
        """Normalizes parsed content into a standard persistence-ready item."""
        pass
