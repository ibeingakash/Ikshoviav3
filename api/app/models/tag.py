import uuid
from sqlalchemy import Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


def generate_tag_id() -> str:
    """Generates a clean, identifiable tag ID."""
    return f"tag_{uuid.uuid4().hex[:12]}"


class DataTag(Base, TimestampMixin):
    """
    DataTag model for tagging resources, documents, chunks, and questions
    with syllabus topics, keywords, and exam tiers.
    """
    __tablename__ = "data_tags"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=generate_tag_id,
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
    category: Mapped[str] = mapped_column(
        String(64),
        default="TOPIC",
        nullable=False,
        index=True,
    )
    description: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False,
    )

    __table_args__ = (
        Index("idx_data_tags_cat_slug", "category", "slug"),
    )

    def __repr__(self) -> str:
        return f"<DataTag(id='{self.id}', slug='{self.slug}', category='{self.category}')>"
