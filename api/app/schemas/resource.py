from datetime import datetime
import hashlib
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.source import SourceResponse


class ResourceBase(BaseModel):
    """Base fields for Resource entity."""
    source_id: str = Field(..., description="ID of parent data source")
    title: str = Field(..., min_length=2, max_length=512, description="Title of the resource or document")
    url: str = Field(..., max_length=2048, description="Canonical URL of the resource")
    resource_type: str = Field(default="ARTICLE", description="Type of resource (ARTICLE, PDF, GAZETTE, REPORT, POLICY_BRIEF)")
    description: Optional[str] = Field(default=None, description="Optional summary or excerpt")
    published_at: Optional[datetime] = Field(default=None, description="Timestamp when article/doc was published")
    content_hash: Optional[str] = Field(default=None, max_length=64, description="SHA-256 hash of content if available")
    status: str = Field(default="DISCOVERED", description="Processing status (DISCOVERED, PENDING_EXTRACTION, PROCESSED, FAILED)")

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        url = v.strip()
        if not (url.startswith("http://") or url.startswith("https://")):
            raise ValueError("url must start with http:// or https://")
        return url


class ResourceCreate(ResourceBase):
    """Payload required to create a resource item."""
    raw_content: Optional[str] = Field(default=None, description="Optional raw text content to auto-compute hash if content_hash is omitted")

    def get_content_hash(self) -> Optional[str]:
        if self.content_hash:
            return self.content_hash
        if self.raw_content:
            return hashlib.sha256(self.raw_content.encode("utf-8")).hexdigest()
        return None


class ResourceUpdate(BaseModel):
    """Payload to update an existing resource."""
    title: Optional[str] = Field(None, min_length=2, max_length=512)
    resource_type: Optional[str] = None
    description: Optional[str] = None
    published_at: Optional[datetime] = None
    content_hash: Optional[str] = None
    status: Optional[str] = None


class ResourceResponse(ResourceBase):
    """Serialized representation of a Resource entity."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    retrieved_at: datetime
    created_at: datetime
    updated_at: datetime
    source: Optional[SourceResponse] = None
