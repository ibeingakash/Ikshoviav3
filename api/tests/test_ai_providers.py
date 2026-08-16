import pytest
from unittest.mock import patch

from app.ai.providers.gemini import GeminiProvider
from app.ai.providers.mock import MockAIProvider
from app.config import Settings


def test_gemini_provider_uses_explicit_argument():
    """Explicitly passed model_name takes precedence over settings."""
    provider = GeminiProvider(api_key="test_key", model_name="gemini-2.5-pro")
    assert provider.model_name == "gemini-2.5-pro"


def test_gemini_provider_respects_configured_gemini_2_5_flash():
    """Provider uses gemini-2.5-flash when GEMINI_MODEL is set to gemini-2.5-flash without rewriting."""
    with patch("app.ai.providers.gemini.settings.GEMINI_MODEL", "gemini-2.5-flash"):
        provider = GeminiProvider(api_key="test_key")
        assert provider.model_name == "gemini-2.5-flash"


def test_gemini_provider_respects_configured_gemini_flash_lite_latest():
    """Provider uses gemini-flash-lite-latest when GEMINI_MODEL is set to gemini-flash-lite-latest."""
    with patch("app.ai.providers.gemini.settings.GEMINI_MODEL", "gemini-flash-lite-latest"):
        provider = GeminiProvider(api_key="test_key")
        assert provider.model_name == "gemini-flash-lite-latest"


def test_gemini_provider_safe_default_when_empty_or_none():
    """Provider falls back to safe default gemini-flash-lite-latest when GEMINI_MODEL is empty or None."""
    with patch("app.ai.providers.gemini.settings.GEMINI_MODEL", ""):
        provider = GeminiProvider(api_key="test_key")
        assert provider.model_name == "gemini-flash-lite-latest"

    with patch("app.ai.providers.gemini.settings.GEMINI_MODEL", None):
        provider = GeminiProvider(api_key="test_key")
        assert provider.model_name == "gemini-flash-lite-latest"


def test_gemini_provider_does_not_silently_rewrite_other_valid_models():
    """Verify that models such as gemini-2.5-flash, gemini-2.5-pro, gemini-1.5-pro are never silently replaced."""
    models_to_test = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-flash-latest",
        "custom-fine-tuned-model",
    ]
    for m in models_to_test:
        with patch("app.ai.providers.gemini.settings.GEMINI_MODEL", m):
            provider = GeminiProvider(api_key="test_key")
            assert provider.model_name == m, f"Model {m} was unexpectedly rewritten to {provider.model_name}"


def test_mock_provider_basic_integrity():
    """MockAIProvider functions as expected without configuration side-effects."""
    mock = MockAIProvider(model_name="mock-model-v1")
    assert mock.model_name == "mock-model-v1"
    assert mock.provider_name == "mock"
