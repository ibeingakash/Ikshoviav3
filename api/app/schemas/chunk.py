from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ChunkBase(BaseModel):
    document_id: str = Field(..., description="Parent Document ID")
    chunk_index: int = Field(..., ge=0, description="Sequential index of the chunk")
    content: str = Field(..., min_length=1, description="Text chunk body")
    token_count: int = Field(default=0, ge=0, description="Estimated token count")
    character_count: int = Field(default=0, ge=0, description="Character count")
    heading: Optional[str] = Field(None, max_length=512, description="Associated section or sub-heading")
    section: Optional[str] = Field(None, max_length=255, description="Document section label")
    chunk_hash: Optional[str] = Field(None, max_length=64, description="SHA-256 chunk hash")
    metadata_json: Optional[Dict[str, Any]] = None


class ChunkCreate(ChunkBase):
    pass


class BatchChunkCreate(BaseModel):
    document_id: str
    chunks: List[ChunkCreate]


class ChunkResponse(ChunkBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
