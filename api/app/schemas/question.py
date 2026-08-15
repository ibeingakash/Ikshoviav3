from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class QuestionOption(BaseModel):
    id: str = Field(..., description="Option identifier (A, B, C, D)")
    text: str = Field(..., min_length=1, description="Option statement")


class DataQuestionBase(BaseModel):
    resource_id: Optional[str] = Field(None, description="Linked Resource ID if derived from public paper/gazette")
    exam: str = Field(default="UPSC_CSE", description="UPSC_CSE, STATE_PCS, SSC_CGL, CDS, etc.")
    year: Optional[int] = Field(None, ge=1990, le=2030, description="Examination Year")
    paper: str = Field(default="GS1", description="GS1, GS2, GS3, GS4, PRELIMS_PAPER1, CSAT, etc.")
    subject: str = Field(default="POLITY", description="POLITY, ECONOMY, HISTORY, GEOGRAPHY, ENVIRONMENT, SCIENCE_TECH, CURRENT_AFFAIRS, ETHICS, ESSAY")
    topic: Optional[str] = Field(None, max_length=255, description="Specific syllabus topic name")
    question_type: str = Field(default="MCQ", description="MCQ, MAINS_SUBJECTIVE")
    question_text: str = Field(..., min_length=5, description="Full question statement")
    options: Optional[List[Dict[str, Any]]] = Field(None, description="List of MCQ options with id and text")
    correct_answer: str = Field(..., description="Correct option key (A, B, C, D) or model answer text")
    explanation: str = Field(..., min_length=5, description="Detailed explanation and reference")
    difficulty: str = Field(default="MEDIUM", description="EASY, MEDIUM, HARD")
    marks: float = Field(default=2.0, ge=0)
    negative_marks: float = Field(default=0.66, ge=0)
    tags: Optional[List[str]] = Field(default_factory=list, description="Taxonomy and syllabus tags")
    is_pyq: bool = Field(default=True, description="Whether this is an official past year question")
    is_verified: bool = Field(default=True, description="Whether key and explanation are verified")


class DataQuestionCreate(DataQuestionBase):
    pass


class BulkQuestionCreate(BaseModel):
    questions: List[DataQuestionCreate]


class DataQuestionUpdate(BaseModel):
    exam: Optional[str] = None
    year: Optional[int] = None
    paper: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    question_type: Optional[str] = None
    question_text: Optional[str] = None
    options: Optional[List[Dict[str, Any]]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: Optional[str] = None
    marks: Optional[float] = None
    negative_marks: Optional[float] = None
    tags: Optional[List[str]] = None
    is_pyq: Optional[bool] = None
    is_verified: Optional[bool] = None


class DataQuestionResponse(DataQuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
