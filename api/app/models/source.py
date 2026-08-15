import uuid
from typing import TYPE_CHECKING, List
from sqlalchemy import Boolean, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.resource import Resource


def generate_source_id() -> str:
    """Generates a clean, identifiable source ID."""
    return f"src_{uuid.uuid4().hex[:12]}"


class Source(Base, TimestampMixin):
    """
    Source model representing an allowed, authenticated or public ingestion origin.
    Provider-independent foundation for Government Portals, Press Releases, Gazettes, etc.
    """
    __tablename__ = "data_sources"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=generate_source_id,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    base_url: Mapped[str] = mapped_column(
        String(1024),
        nullable=False,
    )
    source_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default="GOVERNMENT",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )

    # Relationships
    resources: Mapped[List["Resource"]] = relationship(
        "Resource",
        back_populates="source",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        Index("idx_data_sources_type_active", "source_type", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<Source(id='{self.id}', slug='{self.slug}', name='{self.name}', is_active={self.is_active})>"
