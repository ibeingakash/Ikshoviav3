from typing import Any, Dict, List, Optional
from app.ai.base import (
    AIRequest,
    AIResponse,
    AIUsage,
    BaseAIProvider,
    InvalidRequestError,
    ProviderAuthError,
    ProviderUnavailableError,
    QuotaExceededError,
    RateLimitError,
)


class MockAIProvider(BaseAIProvider):
    """
    Deterministic Mock AI Provider for unit/integration testing and usage reduction measurement.
    Does not make real external network requests.
    """

    def __init__(
        self,
        model_name: str = "mock-tutor-v1",
        default_response: Optional[str] = None,
        is_available: bool = True,
    ):
        self._model_name = model_name
        self.default_response = default_response or "This is a synthesized explanation grounded in the provided civil services context."
        self.is_available = is_available
        
        # Call tracking
        self.calls: List[AIRequest] = []
        self.call_count: int = 0

        # Simulated failure toggles
        self.simulate_rate_limit: bool = False
        self.simulate_quota_exceeded: bool = False
        self.simulate_unavailable: bool = False
        self.simulate_auth_error: bool = False
        self.simulate_invalid_request: bool = False

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return self._model_name

    def reset(self) -> None:
        """Resets call logs and failure toggles."""
        self.calls.clear()
        self.call_count = 0
        self.simulate_rate_limit = False
        self.simulate_quota_exceeded = False
        self.simulate_unavailable = False
        self.simulate_auth_error = False
        self.simulate_invalid_request = False

    async def check_availability(self) -> bool:
        if self.simulate_unavailable or self.simulate_auth_error:
            return False
        return self.is_available

    async def generate(self, request: AIRequest) -> AIResponse:
        self.call_count += 1
        self.calls.append(request)
        mock_mode = (request.metadata or {}).get("mock_mode")

        if self.simulate_auth_error or mock_mode == "auth_error":
            raise ProviderAuthError(
                message="Mock authentication error: API key missing or invalid",
                provider=self.provider_name,
                status_code=401,
            )

        if self.simulate_quota_exceeded or mock_mode == "quota_exceeded":
            raise QuotaExceededError(
                message="Mock quota exceeded error: billing limit reached",
                provider=self.provider_name,
                status_code=429,
            )

        if self.simulate_rate_limit or mock_mode == "rate_limit":
            raise RateLimitError(
                message="Mock rate limit error: too many requests",
                provider=self.provider_name,
                status_code=429,
            )

        if self.simulate_unavailable or mock_mode == "unavailable":
            raise ProviderUnavailableError(
                message="Mock provider unavailable: upstream service down",
                provider=self.provider_name,
                status_code=503,
            )

        if self.simulate_invalid_request or mock_mode == "invalid_request":
            raise InvalidRequestError(
                message="Mock invalid request error: bad parameters",
                provider=self.provider_name,
                status_code=400,
            )

        input_token_est = max(1, len(request.prompt.split()) * 2)
        output_token_est = max(1, len(self.default_response.split()) * 2)

        return AIResponse(
            text=self.default_response,
            provider=self.provider_name,
            model=self.model_name,
            usage=AIUsage(
                input_tokens=input_token_est,
                output_tokens=output_token_est,
                total_tokens=input_token_est + output_token_est,
                latency_ms=15,
            ),
            finish_reason="STOP",
            raw_metadata={"mock": True, "call_index": self.call_count},
        )
