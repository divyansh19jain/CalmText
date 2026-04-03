from openai import AsyncOpenAI
from typing import Tuple
from app.clients.llm_client import LLMClient
from app.core.config import settings

class OpenAIClient(LLMClient):
    def __init__(self):
        # Initializes using the api key from settings
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self._model_name = settings.openai_model_name
        
    async def generate_completion(self, system_prompt: str, user_text: str) -> Tuple[str, int]:
        response = await self.client.chat.completions.create(
            model=settings.openai_model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text}
            ],
            temperature=settings.openai_temperature,
            max_completion_tokens=settings.openai_max_tokens,
        )
        content = response.choices[0].message.content.strip()
        tokens = response.usage.total_tokens if response.usage else 0
        return content, tokens

    @property
    def model_name(self) -> str:
        return self._model_name
