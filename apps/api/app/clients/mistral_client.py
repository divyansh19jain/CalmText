from openai import AsyncOpenAI
from typing import Tuple
from app.clients.llm_client import LLMClient
from app.core.config import settings

class MistralClient(LLMClient):
    """Mistral via its OpenAI-compatible API (same SDK, different base URL)."""

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.mistral_api_key,
            base_url="https://api.mistral.ai/v1",
        )
        self._model_name = settings.mistral_model

    async def generate_completion(self, system_prompt: str, user_text: str) -> Tuple[str, int]:
        response = await self.client.chat.completions.create(
            model=self._model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text}
            ],
            temperature=0.65,
            max_tokens=500,
        )
        content = response.choices[0].message.content.strip()
        tokens = response.usage.total_tokens if response.usage else 0
        return content, tokens

    @property
    def model_name(self) -> str:
        return self._model_name
