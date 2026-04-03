from openai import AsyncOpenAI
from typing import Tuple
from app.clients.llm_client import LLMClient
from app.core.config import settings

class OpenAIClient(LLMClient):
    def __init__(self):
        # Initializes using the api key from settings
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        # self._model_name = "gpt-5.4-nano" # Using a fast default model
        self._model_name = "gpt-4o-mini"
    async def generate_completion(self, system_prompt: str, user_text: str) -> Tuple[str, int]:
        response = await self.client.chat.completions.create(
            model=self._model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text}
            ],
            temperature=0.65,
            max_tokens=200,
            # max_completion_tokens=200,
        )
        content = response.choices[0].message.content.strip()
        tokens = response.usage.total_tokens if response.usage else 0
        return content, tokens

    @property
    def model_name(self) -> str:
        return self._model_name
