from abc import ABC, abstractmethod
from typing import Tuple

class LLMClient(ABC):
    @abstractmethod
    async def generate_completion(self, system_prompt: str, user_text: str) -> Tuple[str, int]:
        """Generates a text completion and token count from the LLM based on prompts."""
        pass
    
    @property
    @abstractmethod
    def model_name(self) -> str:
        """Returns the name of the underlying model being used."""
        pass
