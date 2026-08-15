import uuid
from typing import TYPE_CHECKING, Any, Dict, Optional
from sqlalchemy import ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.document import Document


def generate_chunk_id() -> str:
    """Generates a clean, identifiable chunk ID."""
    return f"chk_{uuid.uuid4().hex[:12]}"


class Chunk(Base, TimestampMixin):
    """
    Chunk model storing granular semantic or token-window chunks
    for search, retrieval, embedding preparation, and study cards.
    """
    __tablename__ = "data_chunks"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=generate_chunk_id,
        nullable=False,
    )
    document_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("data_documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    token_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    character_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    heading: Mapped[Optional[str]] = mapped_column(
        String(512),
        nullable=True,
    )
    section: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    chunk_hash: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True,
    )
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
    )

    # Relationships
    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="chunks",
        lazy="joined",
    )

    __table_args__ = (
        Index("idx_data_chunks_doc_index", "document_id", "chunk_index", unique=True),
    )

    def __repr__(self) -> str:
        return f"<Chunk(id='{self.id}', doc_id='{self.document_id}', index={self.chunk_index}, tokens={self.token_count})>"
