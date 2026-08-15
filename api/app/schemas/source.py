from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class SourceBase(BaseModel):
    """Base fields for Source entity."""
    name: str = Field(..., min_length=2, max_length=255, description="Human-readable name of the source")
    slug: str = Field(..., min_length=2, max_length=255, description="Unique URL/identifier slug for the source")
    base_url: str = Field(..., max_length=1024, description="Root base URL of the source portal")
    source_type: str = Field(default="GOVERNMENT", description="Category of source (e.g. GOVERNMENT, NEWS, ACADEMIC, GAZETTE)")
    is_active: bool = Field(default=True, description="Whether ingestion from this source is currently active")

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        slug = v.strip().lower().replace(" ", "-")
        if not slug:
            raise ValueError("Slug cannot be empty")
        return slug

    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, v: str) -> str:
        url = v.strip()
        if not (url.startswith("http://") or url.startswith("https://")):
            raise ValueError("base_url must start with http:// or https://")
        return url


class SourceCreate(SourceBase):
    """Payload required to create a new source."""
    pass


class SourceUpdate(BaseModel):
    """Payload to update an existing source."""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    base_url: Optional[str] = Field(None, max_length=1024)
    source_type: Optional[str] = None
    is_active: Optional[bool] = None


class SourceResponse(SourceBase):
    """Serialized representation of a Source entity."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
