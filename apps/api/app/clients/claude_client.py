import anthropic
from typing import Tuple
from app.clients.llm_client import LLMClient
from app.core.config import settings

class ClaudeClient(LLMClient):
    def __init__(self):
        # Initializes using the api key from settings
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        # Using claude-3-5-haiku-20241022 as the fast, cost-effective default
        self._model_name = "claude-3-5-haiku-20241022"

    async def generate_completion(self, system_prompt: str, user_text: str) -> Tuple[str, int]:
        response = await self.client.messages.create(
            model=self._model_name,
            max_tokens=200,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_text}
            ],
            temperature=0.65,
        )
        # Extract content from the response
        content = ""
        if response.content and len(response.content) > 0:
            content = response.content[0].text.strip()
        
        # Approximate tokens if usage is not available or structure is different
        tokens = response.usage.total_tokens if response.usage else 0
        
        return content, tokens

    @property
    def model_name(self) -> str:
        return self._model_name
