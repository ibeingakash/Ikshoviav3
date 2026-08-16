from typing import Dict, Optional
from app.ai.base import (
    AIProviderError,
    BaseAIProvider,
    ProviderUnavailableError,
)
from app.ai.providers.gemini import GeminiProvider
from app.ai.providers.mock import MockAIProvider
from app.config import settings
from app.core.logging import logger


class AIGateway:
    """
    Provider-Agnostic AI Gateway.
    Centralized abstraction for registering, resolving, and routing AI model calls
    without binding application business logic to any individual LLM vendor.
    """

    def __init__(self, default_provider_name: Optional[str] = None):
        self._default_provider_name = default_provider_name or settings.AI_PROVIDER or "gemini"
        self._providers: Dict[str, BaseAIProvider] = {}
        self._initialize_default_providers()

    def _initialize_default_providers(self) -> None:
        """Instantiates default built-in providers."""
        # Always register the Gemini provider
        self.register_provider("gemini", GeminiProvider())
        # Always register the Mock provider for testing
        self.register_provider("mock", MockAIProvider())

    def register_provider(self, name: str, provider: BaseAIProvider) -> None:
        """Registers or replaces an AI provider instance under a key."""
        clean_name = name.lower().strip()
        self._providers[clean_name] = provider
        logger.info(f"[AIGateway] Registered AI provider: '{clean_name}' ({provider.__class__.__name__})")

    def set_active_provider(self, name: str) -> None:
        """Changes the default active provider name."""
        clean_name = name.lower().strip()
        self._default_provider_name = clean_name

    def get_provider(self, name: Optional[str] = None) -> BaseAIProvider:
        """
        Retrieves a registered AI provider by name or the default active provider.
        """
        target_name = (name or self._default_provider_name or settings.AI_PROVIDER or "gemini").lower().strip()
        
        provider = self._providers.get(target_name)
        if not provider:
            # Fallback initialization if requested provider is known
            if target_name == "gemini":
                provider = GeminiProvider()
                self._providers["gemini"] = provider
            elif target_name == "mock":
                provider = MockAIProvider()
                self._providers["mock"] = provider
            else:
                raise ProviderUnavailableError(
                    message=f"AI Provider '{target_name}' is not registered with the gateway",
                    provider=target_name,
                )

        return provider


# Global application AI Gateway instance
ai_gateway = AIGateway()
