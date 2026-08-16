from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class KnowledgeConfidence(str, Enum):
    """Retrieval confidence classification."""
    STRONG = "STRONG"
    WEAK = "WEAK"
    NONE = "NONE"


class SourceCitation(BaseModel):
    """Structured citation metadata preserving provenance of IKSHOVIA knowledge assets."""
    id: str = Field(description="Unique entity ID (e.g. dq_..., doc_..., chk_...)")
    type: str = Field(description="Entity type: 'question', 'document', 'chunk', or 'tag'")
    title: str = Field(description="Title or headline of the source knowledge asset")
    source_name: Optional[str] = Field(default=None, description="Originating authority/portal (e.g. PIB, UPSC, ISRO)")
    source_url: Optional[str] = Field(default=None, description="Direct URL if available")
    published_at: Optional[str] = Field(default=None, description="Original publication timestamp if known")
    resource_id: Optional[str] = Field(default=None, description="Linked resource identifier")
    document_id: Optional[str] = Field(default=None, description="Linked document identifier")
    snippet: str = Field(description="Bounded relevant excerpt used as grounding context")
    score: float = Field(description="Relevance score normalized between 0.0 and 1.0")

    model_config = ConfigDict(from_attributes=True)


class KnowledgeResultMetadata(BaseModel):
    """Metadata detailing IKSHOVIA Knowledge Search retrieval execution and findings."""
    used: bool = Field(description="Whether verified IKSHOVIA knowledge assets were retrieved and used")
    result_count: int = Field(description="Number of relevant knowledge entities found")
    confidence: str = Field(description="Retrieval confidence rating: 'STRONG', 'WEAK', or 'NONE'")
    sources: List[SourceCitation] = Field(default_factory=list, description="Structured citations list")


class AIUsageMetadata(BaseModel):
    """Normalized token and performance usage metrics."""
    input_tokens: Optional[int] = Field(default=None, description="Number of prompt tokens evaluated")
    output_tokens: Optional[int] = Field(default=None, description="Number of completion tokens generated")
    total_tokens: Optional[int] = Field(default=None, description="Total tokens consumed")
    latency_ms: Optional[int] = Field(default=None, description="AI gateway processing latency in milliseconds")


class AIResultMetadata(BaseModel):
    """Metadata detailing whether external AI was engaged, model used, and usage details."""
    used: bool = Field(description="Whether an AI model was called (False when knowledge retrieval is sufficient)")
    provider: Optional[str] = Field(default=None, description="Name of the AI provider engaged (e.g. 'gemini', 'mock')")
    model: Optional[str] = Field(default=None, description="Model identifier used")
    usage: Optional[AIUsageMetadata] = Field(default=None, description="Token and latency usage breakdown")
    error: Optional[str] = Field(default=None, description="Safe error message if AI synthesis failed or was bypassed")


class TutorRequest(BaseModel):
    """Input payload for IKSHOVIA AI Tutor query."""
    message: str = Field(min_length=1, max_length=4000, description="User's query or concept question")
    conversation_id: Optional[str] = Field(default=None, description="Optional conversation session ID")
    exam: Optional[str] = Field(default=None, description="Target exam filter (e.g. 'UPSC CSE', 'BPSC', 'SSC')")
    subject: Optional[str] = Field(default=None, description="Subject domain filter (e.g. 'Polity', 'History')")
    topic: Optional[str] = Field(default=None, description="Specific topic filter (e.g. 'Fundamental Rights')")
    mode: Optional[str] = Field(default="tutor", description="Interaction mode ('tutor', 'revision', 'mains', 'mcq')")
    force_ai: Optional[bool] = Field(default=False, description="Explicit flag to trigger AI synthesis even on strong knowledge")
    provider: Optional[str] = Field(default=None, description="Optional provider override (e.g. 'mock' for testing)")
    mock_mode: Optional[str] = Field(default=None, description="Optional mock simulation mode for testing")


class TutorResponse(BaseModel):
    """Standardized response from the IKSHOVIA AI Tutor."""
    success: bool = Field(default=True, description="Indicates request success")
    answer: str = Field(description="The primary explanation, answer, or synthesis for the student")
    confidence: str = Field(description="Knowledge grounding confidence: 'STRONG', 'WEAK', or 'NONE'")
    knowledge: KnowledgeResultMetadata = Field(description="Retrieved IKSHOVIA knowledge metadata and citations")
    ai: AIResultMetadata = Field(description="AI gateway execution and usage metadata")
