from openai import AsyncOpenAI
from typing import Tuple
from app.clients.llm_client import LLMClient
from app.core.config import settings

class OpenAIClient(LLMClient):
    def __init__(self, model_name: str | None = None):
        # Initializes using the api key from settings
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        # Defaults to the free-trial model; subscribers are upgraded via set_model().
        self._model_name = model_name or settings.openai_free_model

    def set_model(self, model_name: str) -> None:
        """Switch the model used for subsequent completions (e.g. paid tier)."""
        if model_name:
            self._model_name = model_name

    async def generate_completion(self, system_prompt: str, user_text: str) -> Tuple[str, int]:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ]
        if self._model_name.startswith("gpt-5"):
            # GPT-5 family rejects `max_tokens` and non-default temperature.
            # It also spends tokens on internal reasoning, so give it headroom
            # and keep reasoning minimal for fast, short replies.
            response = await self.client.chat.completions.create(
                model=self._model_name,
                messages=messages,
                max_completion_tokens=2000,
                reasoning_effort="minimal",
            )
        else:
            response = await self.client.chat.completions.create(
                model=self._model_name,
                messages=messages,
                temperature=0.65,
                max_tokens=500,
            )
        content = (response.choices[0].message.content or "").strip()
        tokens = response.usage.total_tokens if response.usage else 0
        return content, tokens

    @property
    def model_name(self) -> str:
        return self._model_name
