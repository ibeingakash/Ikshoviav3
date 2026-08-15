from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class JobBase(BaseModel):
    source_id: Optional[str] = Field(None, description="Linked Source ID if applicable")
    resource_id: Optional[str] = Field(None, description="Linked Resource ID if applicable")
    job_type: str = Field(default="EXTRACTION", description="DISCOVERY, EXTRACTION, CHUNKING, SYNC")
    status: str = Field(default="PENDING", description="PENDING, RUNNING, COMPLETED, FAILED, CANCELLED")
    progress_percentage: int = Field(default=0, ge=0, le=100)
    items_processed: int = Field(default=0, ge=0)
    total_items: int = Field(default=0, ge=0)
    error_log: Optional[str] = None
    meta_info: Optional[Dict[str, Any]] = None


class JobCreate(BaseModel):
    source_id: Optional[str] = None
    resource_id: Optional[str] = None
    job_type: str = Field(default="EXTRACTION", description="DISCOVERY, EXTRACTION, CHUNKING, SYNC")
    meta_info: Optional[Dict[str, Any]] = None


class JobUpdate(BaseModel):
    status: Optional[str] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
    items_processed: Optional[int] = Field(None, ge=0)
    total_items: Optional[int] = Field(None, ge=0)
    error_log: Optional[str] = None
    meta_info: Optional[Dict[str, Any]] = None


class JobResponse(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
