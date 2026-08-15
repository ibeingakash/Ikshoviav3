import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.source import Source


def generate_resource_id() -> str:
    """Generates a clean, identifiable resource ID."""
    return f"res_{uuid.uuid4().hex[:12]}"


class Resource(Base, TimestampMixin):
    """
    Resource model representing an ingested public or allowed resource item
    (PDF, Press Release, Gazette, Report, Policy Document, or Article).
    Provider-independent database model.
    """
    __tablename__ = "data_resources"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=generate_resource_id,
        nullable=False,
    )
    source_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("data_sources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(
        String(2048),
        unique=True,
        index=True,
        nullable=False,
    )
    resource_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="ARTICLE",
        index=True,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    retrieved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    content_hash: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="DISCOVERED",
        index=True,
    )

    # Relationships
    source: Mapped["Source"] = relationship(
        "Source",
        back_populates="resources",
        lazy="joined",
    )

    __table_args__ = (
        Index("idx_data_resources_source_type_status", "source_id", "resource_type", "status"),
        Index("idx_data_resources_published", "published_at"),
    )

    def __repr__(self) -> str:
        return f"<Resource(id='{self.id}', title='{self.title[:30]}...', status='{self.status}')>"
