from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, HttpUrl


class IngestionRunRequest(BaseModel):
    """Payload for triggering the generic ingestion pipeline on a permitted resource URL."""
    url: str = Field(
        ...,
        description="Public permitted URL to ingest (must be HTTP/HTTPS).",
        examples=["https://pib.gov.in/PressReleasePage.aspx?PRID=1888798"],
    )
    source_id: Optional[str] = Field(
        None,
        description="Optional Source ID to link the ingested resource with.",
    )
    chunk_size: int = Field(
        default=500,
        ge=10,
        le=4000,
        description="Word count per generated text chunk.",
    )
    chunk_overlap: int = Field(
        default=50,
        ge=0,
        le=500,
        description="Word overlap between consecutive chunks.",
    )


class IngestionRunData(BaseModel):
    """Ingestion execution summary data."""
    job_id: str
    status: str
    url: str
    success: bool
    source_id: Optional[str] = None
    resource_id: Optional[str] = None
    document_id: Optional[str] = None
    chunks_count: int = 0
    content_hash: Optional[str] = None
    is_duplicate: bool = False
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    duration_ms: float = 0.0
    meta_info: Dict[str, Any] = Field(default_factory=dict)
