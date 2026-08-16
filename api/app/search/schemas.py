from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SearchItemType(str, Enum):
    """Supported searchable knowledge entity types."""
    QUESTION = "question"
    DOCUMENT = "document"
    CHUNK = "chunk"
    TAG = "tag"


class SearchResultItem(BaseModel):
    """Unified representation of a retrieved knowledge item."""
    type: str = Field(description="Entity type: 'question', 'document', 'chunk', or 'tag'")
    id: str = Field(description="Unique entity identifier (e.g. dq_..., doc_..., chk_..., tag_...)")
    title: str = Field(description="Concise display title or headline for the result item")
    content: str = Field(description="Safe excerpt or snippet of the matched content")
    source_id: Optional[str] = Field(default=None, description="Linked data source ID if available")
    resource_id: Optional[str] = Field(default=None, description="Linked resource item ID if available")
    document_id: Optional[str] = Field(default=None, description="Linked document ID for chunks/documents")
    score: float = Field(description="Deterministic relevance score normalized between 0.0 and 1.0")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Entity-specific metadata attributes")

    model_config = ConfigDict(from_attributes=True)


class SearchPagination(BaseModel):
    """Pagination metadata for search results."""
    page: int = Field(description="Current active page (1-indexed)")
    page_size: int = Field(description="Number of results per page")
    total: int = Field(description="Total number of matching results across knowledge entities")
    total_pages: int = Field(description="Total number of available pages")
    has_next: bool = Field(default=False, description="Whether another page exists")
    has_previous: bool = Field(default=False, description="Whether a preceding page exists")


class SearchResponse(BaseModel):
    """Unified API response structure for knowledge search queries."""
    success: bool = Field(default=True, description="Indicates successful request completion")
    query: str = Field(description="Original sanitized search query string")
    results: List[SearchResultItem] = Field(default_factory=list, description="Ranked knowledge items")
    pagination: SearchPagination = Field(description="Pagination metadata")


class SearchQueryFilters(BaseModel):
    """Encapsulates optional knowledge filtering parameters."""
    exam: Optional[str] = None
    year: Optional[int] = None
    paper: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    question_type: Optional[str] = None
    difficulty: Optional[str] = None
    is_pyq: Optional[bool] = None
    source_id: Optional[str] = None
    resource_id: Optional[str] = None
    content_type: Optional[str] = None
    tag: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
