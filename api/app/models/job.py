import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


def generate_job_id() -> str:
    """Generates a clean, identifiable job ID."""
    return f"job_{uuid.uuid4().hex[:12]}"


class IngestionJob(Base, TimestampMixin):
    """
    IngestionJob tracks lifecycle, progress, and logs of asynchronous
    or scheduled ingestion, scraping, parsing, and chunking jobs.
    """
    __tablename__ = "data_ingestion_jobs"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=generate_job_id,
        nullable=False,
    )
    source_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("data_sources.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    resource_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("data_resources.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    job_type: Mapped[str] = mapped_column(
        String(64),
        default="EXTRACTION",
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(64),
        default="PENDING",
        nullable=False,
        index=True,
    )
    progress_percentage: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    items_processed: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    total_items: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    error_log: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    meta_info: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    __table_args__ = (
        Index("idx_data_jobs_type_status", "job_type", "status"),
    )

    def __repr__(self) -> str:
        return f"<IngestionJob(id='{self.id}', type='{self.job_type}', status='{self.status}', progress={self.progress_percentage}%)>"
