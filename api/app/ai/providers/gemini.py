import time
from typing import Any, Dict, Optional
import httpx
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
from app.config import settings
from app.core.logging import logger


class GeminiProvider(BaseAIProvider):
    """
    Production-grade Gemini AI Provider using direct REST integration.
    Fully provider-agnostic, configurable, and safely maps raw errors to normalized exceptions.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 30.0,
    ):
        self._api_key = api_key or settings.GEMINI_API_KEY
        # Resolution order: explicitly passed model_name -> settings.GEMINI_MODEL -> safe default
        configured_model = (
            (model_name.strip() if model_name else None)
            or (settings.GEMINI_MODEL.strip() if settings.GEMINI_MODEL else None)
            or "gemini-flash-lite-latest"
        )
        self._model_name = configured_model
        self._base_url = (base_url or settings.GEMINI_API_BASE_URL or "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
        self._timeout = timeout

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self._model_name

    async def check_availability(self) -> bool:
        """Lightweight check verifying if the Gemini API key is configured."""
        return bool(self._api_key and len(self._api_key.strip()) > 5)

    async def generate(self, request: AIRequest) -> AIResponse:
        """
        Calls the Gemini REST API with the normalized AIRequest payload.
        """
        if not self._api_key:
            raise ProviderAuthError(
                message="GEMINI_API_KEY is not configured on the server",
                provider=self.provider_name,
                status_code=401,
            )

        endpoint = f"{self._base_url}/models/{self._model_name}:generateContent"
        params = {"key": self._api_key}

        # Format Gemini 1.5 / 2.0 / 2.5 REST payload
        payload: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": request.prompt}],
                }
            ],
            "generationConfig": {
                "temperature": request.temperature,
                "maxOutputTokens": request.max_tokens,
            },
        }

        if request.system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": request.system_instruction}]
            }

        start_time = time.perf_counter()

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(endpoint, params=params, json=payload)
        except httpx.TimeoutException as te:
            logger.warn(f"[GeminiProvider] Request timed out: {te}")
            raise ProviderUnavailableError(
                message="Gemini API request timed out",
                provider=self.provider_name,
                status_code=504,
                raw_error=te,
            )
        except httpx.RequestError as re:
            logger.warn(f"[GeminiProvider] Network connection failure: {re}")
            raise ProviderUnavailableError(
                message=f"Gemini API network connection failure: {re}",
                provider=self.provider_name,
                status_code=503,
                raw_error=re,
            )

        latency_ms = int((time.perf_counter() - start_time) * 1000)

        # Handle HTTP Status Code Failures
        if response.status_code != 200:
            self._handle_error_response(response)

        data = response.json()

        # Extract generated candidate text
        candidates = data.get("candidates") or []
        if not candidates:
            raise ProviderUnavailableError(
                message="Gemini returned an empty candidate list",
                provider=self.provider_name,
                status_code=502,
                raw_error=data,
            )

        first_candidate = candidates[0]
        content = first_candidate.get("content") or {}
        parts = content.get("parts") or []
        generated_text = "".join(part.get("text", "") for part in parts).strip()
        finish_reason = first_candidate.get("finishReason")

        # Extract usage token metadata if available
        usage_meta = data.get("usageMetadata") or {}
        usage = AIUsage(
            input_tokens=usage_meta.get("promptTokenCount"),
            output_tokens=usage_meta.get("candidatesTokenCount"),
            total_tokens=usage_meta.get("totalTokenCount"),
            latency_ms=latency_ms,
        )

        return AIResponse(
            text=generated_text,
            provider=self.provider_name,
            model=self.model_name,
            usage=usage,
            finish_reason=finish_reason,
            raw_metadata={"candidates_count": len(candidates)},
        )

    def _handle_error_response(self, response: httpx.Response) -> None:
        """Translates raw HTTP errors into domain-specific, safe exceptions without leaking credentials."""
        status = response.status_code
        try:
            error_data = response.json().get("error", {})
            error_msg = error_data.get("message", response.text)
            error_status = error_data.get("status", "")
        except Exception:
            error_msg = response.text
            error_status = ""

        logger.warn(f"[GeminiProvider] Error HTTP {status}: {error_status} - {error_msg}")

        if status in (401, 403):
            raise ProviderAuthError(
                message="Invalid or unauthorized Gemini API key",
                provider=self.provider_name,
                status_code=status,
                raw_error=error_msg,
            )
        elif status == 429 or error_status == "RESOURCE_EXHAUSTED":
            if "quota" in error_msg.lower():
                raise QuotaExceededError(
                    message="Gemini API quota exceeded for current project/account",
                    provider=self.provider_name,
                    status_code=429,
                    raw_error=error_msg,
                )
            raise RateLimitError(
                message="Gemini API rate limit reached. Please retry in a moment",
                provider=self.provider_name,
                status_code=429,
                raw_error=error_msg,
            )
        elif status == 400:
            raise InvalidRequestError(
                message=f"Gemini API request validation error: {error_msg}",
                provider=self.provider_name,
                status_code=400,
                raw_error=error_msg,
            )
        else:
            raise ProviderUnavailableError(
                message=f"Gemini API upstream error (HTTP {status})",
                provider=self.provider_name,
                status_code=status,
                raw_error=error_msg,
            )
