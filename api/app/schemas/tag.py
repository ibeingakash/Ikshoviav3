from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class TagBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Human-readable tag name")
    slug: str = Field(..., min_length=2, max_length=255, description="Unique slug for taxonomy tag")
    category: str = Field(default="TOPIC", description="SUBJECT, TOPIC, SYLLABUS_SECTION, EXAM_TIER")
    description: str = Field(default="", description="Tag description")

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        slug = v.strip().lower().replace(" ", "-")
        if not slug:
            raise ValueError("Slug cannot be empty")
        return slug


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
