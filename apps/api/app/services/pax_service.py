import time
from app.schemas.pax import PaxAnalyzeRequest, PaxAnalyzeResponse
from app.services.prompt_service import PromptService
from app.clients.llm_client import LLMClient
from app.core.logging import logger

class PaxService:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client
        
    async def analyze(self, request: PaxAnalyzeRequest) -> PaxAnalyzeResponse:
        start_time = time.time()
        
        version, prompt_text = PromptService.get_prompt(request.prompt_version)
        logger.info(f"Analyzing text using prompt version: {version}")
        
        pax_output, tokens_used = await self.llm_client.generate_completion(
            system_prompt=prompt_text,
            user_text=request.text
        )
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        return PaxAnalyzeResponse(
            pax=pax_output,
            prompt_version=version,
            model=self.llm_client.model_name,
            latency_ms=latency_ms,
            tokens_used=tokens_used
        )
