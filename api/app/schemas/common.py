from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard success wrapper for single item responses."""
    success: bool = True
    data: T
    message: Optional[str] = None


class PaginatedMeta(BaseModel):
    """Metadata describing pagination status."""
    total: int = Field(description="Total number of items matching filter criteria")
    page: int = Field(description="Current active page (1-indexed)")
    page_size: int = Field(description="Number of items returned per page")
    total_pages: int = Field(description="Total number of pages")
    has_next: bool = Field(description="Whether there is a subsequent page available")
    has_previous: bool = Field(description="Whether there is a preceding page")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard pagination wrapper for list endpoints."""
    success: bool = True
    data: List[T]
    pagination: PaginatedMeta
