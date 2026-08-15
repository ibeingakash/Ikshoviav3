import uuid
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import BigInteger, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.resource import Resource
    from app.models.chunk import Chunk


def generate_document_id() -> str:
    """Generates a clean, identifiable document ID."""
    return f"doc_{uuid.uuid4().hex[:12]}"


class Document(Base, TimestampMixin):
    """
    Document model storing extracted content, parsed representations,
    metadata, and extraction status linked to a parent Resource.
    """
    __tablename__ = "data_documents"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=generate_document_id,
        nullable=False,
    )
    resource_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("data_resources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    raw_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    clean_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    mime_type: Mapped[str] = mapped_column(
        String(128),
        default="text/plain",
        nullable=False,
    )
    file_size_bytes: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        nullable=True,
    )
    page_count: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )
    language: Mapped[str] = mapped_column(
        String(16),
        default="en",
        nullable=False,
    )
    meta_info: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
    )
    extraction_status: Mapped[str] = mapped_column(
        String(64),
        default="PENDING",
        nullable=False,
        index=True,
    )
    extraction_method: Mapped[str] = mapped_column(
        String(64),
        default="DIRECT_TEXT",
        nullable=False,
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Relationships
    chunks: Mapped[List["Chunk"]] = relationship(
        "Chunk",
        back_populates="document",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        Index("idx_data_documents_resource_status", "resource_id", "extraction_status"),
    )

    def __repr__(self) -> str:
        return f"<Document(id='{self.id}', resource_id='{self.resource_id}', status='{self.extraction_status}')>"
