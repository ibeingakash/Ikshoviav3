from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, HttpUrl


class FetchResponse(BaseModel):
    """Normalized response container from an HTTP fetch operation."""
    url: str
    status_code: int
    content_type: str = "text/plain"
    headers: Dict[str, str] = Field(default_factory=dict)
    raw_content: bytes = b""
    text_content: str = ""
    encoding: str = "utf-8"
    content_length: int = 0
    elapsed_ms: float = 0.0


class ParsedContent(BaseModel):
    """Raw parsed structure extracted from fetched response."""
    url: str
    title: str = ""
    text: str = ""
    description: Optional[str] = None
    language: str = "en"
    mime_type: str = "text/plain"
    published_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    extraction_method: str = "DIRECT_TEXT"


class NormalizedIngestionItem(BaseModel):
    """Standardized internal representation of content ready for persistence."""
    source_identifier: str = "generic_http"
    source_id: Optional[str] = None
    title: str
    url: str
    content: str
    content_type: str = "ARTICLE"
    description: Optional[str] = None
    published_at: Optional[datetime] = None
    retrieved_at: datetime = Field(default_factory=datetime.utcnow)
    content_hash: str
    language: str = "en"
    mime_type: str = "text/plain"
    extraction_method: str = "DIRECT_TEXT"
    quality_score: float = 1.0
    meta_info: Dict[str, Any] = Field(default_factory=dict)


@dataclass
class IngestionPipelineResult:
    """Structured result returned by the ingestion pipeline."""
    success: bool
    url: str
    source_id: Optional[str] = None
    resource_id: Optional[str] = None
    document_id: Optional[str] = None
    chunk_ids: List[str] = field(default_factory=list)
    chunks_count: int = 0
    content_hash: Optional[str] = None
    is_duplicate: bool = False
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    duration_ms: float = 0.0
