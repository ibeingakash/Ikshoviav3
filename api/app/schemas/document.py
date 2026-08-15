from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DocumentBase(BaseModel):
    resource_id: str = Field(..., description="Parent Resource ID")
    raw_text: Optional[str] = Field(None, description="Extracted raw text content")
    clean_text: Optional[str] = Field(None, description="Cleaned, normalized text content")
    mime_type: str = Field(default="text/plain", description="MIME type of extracted document")
    file_size_bytes: Optional[int] = Field(None, ge=0, description="Size in bytes")
    page_count: Optional[int] = Field(None, ge=1, description="Page count if document is multi-page")
    language: str = Field(default="en", max_length=16, description="Language ISO code")
    meta_info: Optional[Dict[str, Any]] = Field(None, description="Document metadata attributes")
    extraction_status: str = Field(default="PENDING", description="PENDING, EXTRACTED, FAILED")
    extraction_method: str = Field(default="DIRECT_TEXT", description="DIRECT_TEXT, OCR_FALLBACK, HTML_PARSER")
    error_message: Optional[str] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    raw_text: Optional[str] = None
    clean_text: Optional[str] = None
    mime_type: Optional[str] = None
    page_count: Optional[int] = None
    language: Optional[str] = None
    meta_info: Optional[Dict[str, Any]] = None
    extraction_status: Optional[str] = None
    extraction_method: Optional[str] = None
    error_message: Optional[str] = None


class DocumentChunkRequest(BaseModel):
    chunk_size: int = Field(default=500, ge=10, le=4000, description="Approximate word/token size per chunk")
    chunk_overlap: int = Field(default=50, ge=0, le=500, description="Overlap between consecutive chunks")


class DocumentResponse(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
