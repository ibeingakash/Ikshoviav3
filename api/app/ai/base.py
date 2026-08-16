from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, Optional


# -------------------------------------------------------------
# Normalized AI Usage & Request/Response Models
# -------------------------------------------------------------

@dataclass
class AIUsage:
    """Normalized token and performance usage metadata."""
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    latency_ms: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": self.total_tokens,
            "latency_ms": self.latency_ms,
        }


@dataclass
class AIRequest:
    """Normalized input payload passed to any AI provider."""
    prompt: str
    system_instruction: Optional[str] = None
    temperature: float = 0.2
    max_tokens: int = 1024
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AIResponse:
    """Normalized output returned by any AI provider."""
    text: str
    provider: str
    model: str
    usage: Optional[AIUsage] = None
    finish_reason: Optional[str] = None
    raw_metadata: Dict[str, Any] = field(default_factory=dict)


# -------------------------------------------------------------
# Normalized Provider Error Hierarchy
# -------------------------------------------------------------

class AIProviderError(Exception):
    """Base exception for all AI Provider Gateway failures."""
    def __init__(self, message: str, provider: str = "unknown", status_code: Optional[int] = None, raw_error: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.provider = provider
        self.status_code = status_code
        self.raw_error = raw_error


class ProviderAuthError(AIProviderError):
    """Raised when authentication credentials or API key is missing or invalid."""
    pass


class RateLimitError(AIProviderError):
    """Raised when an AI provider rate limit is encountered (HTTP 429)."""
    pass


class QuotaExceededError(AIProviderError):
    """Raised when provider credit or quota has been exhausted."""
    pass


class ProviderUnavailableError(AIProviderError):
    """Raised when an AI provider is unreachable, down, or timed out."""
    pass


class InvalidRequestError(AIProviderError):
    """Raised when the prompt or parameters violate provider validation."""
    pass


# -------------------------------------------------------------
# Abstract Base AI Provider Interface
# -------------------------------------------------------------

class BaseAIProvider(ABC):
    """
    Abstract interface for AI model providers (Gemini, OpenAI, Anthropic, Mock, etc.).
    Ensures complete decoupling of the IKSHOVIA Tutor from specific LLM vendors.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Unique provider identifier (e.g. 'gemini', 'openai', 'anthropic', 'mock')."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Active model identifier (e.g. 'gemini-2.5-flash', 'gpt-4o', 'mock-model')."""
        pass

    @abstractmethod
    async def generate(self, request: AIRequest) -> AIResponse:
        """
        Executes generation against the underlying model and returns a normalized response.
        Raises normalized AIProviderError subclasses on failure.
        """
        pass

    @abstractmethod
    async def check_availability(self) -> bool:
        """
        Performs a lightweight connectivity or credential check.
        Returns True if the provider is configured and ready.
        """
        pass
