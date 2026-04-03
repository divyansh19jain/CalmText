from app.clients.llm_client import LLMClient
from app.core.config import settings
from anthropic import AsyncAnthropic
from typing import Tuple

class ClaudeClient(LLMClient):
    def __init__(self):
        # Initializes using the api key from settings
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._model_name = settings.anthropic_model_name
        
    async def generate_completion(self, system_prompt: str, user_text: str) -> Tuple[str, int]:
        response = await self.client.messages.create(
            model=self._model_name,
            max_tokens=200,
            temperature=0.65,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_text}
            ]
        )
        # Claude response structure is different: response.content is a list of TextBlock
        content = response.content[0].text.strip()
        tokens = response.usage.output_tokens if response.usage else 0
        return content, tokens

    @property
    def model_name(self) -> str:
        return self._model_name
