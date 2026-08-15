import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import Boolean, Float, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


def generate_data_question_id() -> str:
    """Generates a clean, identifiable question ID."""
    return f"dq_{uuid.uuid4().hex[:12]}"


class DataQuestion(Base, TimestampMixin):
    """
    DataQuestion represents ingested Civil Services / State PCS / Competitive Exam questions,
    MCQs, PYQs, and Mains questions with official keys, explanations, and taxonomy tags.
    """
    __tablename__ = "data_questions"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        default=generate_data_question_id,
        nullable=False,
    )
    resource_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("data_resources.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    exam: Mapped[str] = mapped_column(
        String(64),
        default="UPSC_CSE",
        nullable=False,
        index=True,
    )
    year: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )
    paper: Mapped[str] = mapped_column(
        String(64),
        default="GS1",
        nullable=False,
        index=True,
    )
    subject: Mapped[str] = mapped_column(
        String(64),
        default="POLITY",
        nullable=False,
        index=True,
    )
    topic: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    question_type: Mapped[str] = mapped_column(
        String(32),
        default="MCQ",
        nullable=False,
        index=True,
    )
    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    options: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(
        JSON,
        nullable=True,
    )
    correct_answer: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    explanation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    difficulty: Mapped[str] = mapped_column(
        String(32),
        default="MEDIUM",
        nullable=False,
        index=True,
    )
    marks: Mapped[float] = mapped_column(
        Float,
        default=2.0,
        nullable=False,
    )
    negative_marks: Mapped[float] = mapped_column(
        Float,
        default=0.66,
        nullable=False,
    )
    tags: Mapped[Optional[List[str]]] = mapped_column(
        JSON,
        nullable=True,
    )
    is_pyq: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )

    __table_args__ = (
        Index("idx_data_questions_exam_year_paper", "exam", "year", "paper"),
        Index("idx_data_questions_subject_type", "subject", "question_type"),
    )

    def __repr__(self) -> str:
        return f"<DataQuestion(id='{self.id}', exam='{self.exam}', year={self.year}, subject='{self.subject}')>"
