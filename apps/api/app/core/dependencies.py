from app.clients.llm_client import LLMClient
from app.clients.mock_llm_client import MockLLMClient
from app.clients.openai_client import OpenAIClient
from app.clients.claude_client import ClaudeClient
from app.core.config import settings

def get_llm_client() -> LLMClient:
    if settings.model_provider == "openai":
        return OpenAIClient()
    return MockLLMClient()

def get_claude_client() -> LLMClient:
    return ClaudeClient()
