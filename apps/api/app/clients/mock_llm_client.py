import asyncio
from typing import Tuple
from app.clients.llm_client import LLMClient

class MockLLMClient(LLMClient):
    async def generate_completion(self, system_prompt: str, user_text: str) -> Tuple[str, int]:
        # Simulate small network latency
        await asyncio.sleep(0.1)
        
        # Simple deterministic mocked logic based on prompt variants
        if "wise" in system_prompt: # Variant B specific
            return "Breathe. You have time.", 15
        
        # Variant A or default fallback
        return "*tilts head*", 6
        
    @property
    def model_name(self) -> str:
        return "mock-model"
