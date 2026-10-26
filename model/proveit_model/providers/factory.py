import logging
from typing import Optional, Dict, Any
from proveit_model.providers.base import BaseLLMProvider
from proveit_model.providers.gemini import GeminiProvider
from proveit_model.providers.openai_provider import OpenAIProvider
from proveit_model.providers.anthropic_provider import AnthropicProvider

logger = logging.getLogger(__name__)


def create_llm_provider(
    provider_name: str = "gemini",
    api_key: str = "",
    model_name: Optional[str] = None,
    base_url: Optional[str] = None,
) -> BaseLLMProvider:
    """Factory to create an appropriate LLM provider instance."""
    p_lower = (provider_name or "gemini").lower().strip()

    if p_lower == "openai":
        return OpenAIProvider(
            api_key=api_key,
            model_name=model_name or "gpt-4o",
            base_url=base_url,
        )
    elif p_lower == "anthropic":
        return AnthropicProvider(
            api_key=api_key,
            model_name=model_name or "claude-3-5-sonnet-20241022",
        )
    elif p_lower == "groq":
        return OpenAIProvider(
            api_key=api_key,
            model_name=model_name or "qwen/qwen3.8-27b",
            base_url="https://api.groq.com/openai/v1",
        )
    elif p_lower == "ollama":
        return OpenAIProvider(
            api_key="ollama",
            model_name=model_name or "llama3.2",
            base_url=base_url or "http://localhost:11434/v1",
        )
    else:  # default to gemini
        return GeminiProvider(
            api_key=api_key,
            model_name=model_name or "gemini-2.5-flash",
        )


async def test_llm_connection(
    provider_name: str,
    api_key: str,
    model_name: Optional[str] = None,
    base_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Test live LLM connectivity with a quick handshake."""
    try:
        from proveit_model.providers.base import AgentMessage
        provider = create_llm_provider(
            provider_name=provider_name,
            api_key=api_key,
            model_name=model_name,
            base_url=base_url,
        )
        resp = await provider.generate_response(
            messages=[AgentMessage(role="user", content="Ping. Respond with 'PONG' and your model name in one line.")],
        )
        return {
            "status": "connected",
            "provider": provider_name,
            "model": model_name or "default",
            "response": resp.content[:100],
        }
    except Exception as e:
        logger.error(f"LLM connection test failed: {e}")
        return {
            "status": "error",
            "provider": provider_name,
            "message": str(e),
        }
