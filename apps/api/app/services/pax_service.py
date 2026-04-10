import time
import json
from app.schemas.pax import PaxAnalyzeRequest, PaxAnalyzeResponse
from app.services.prompt_service import PromptService
from app.clients.llm_client import LLMClient
from app.core.logging import logger

class PaxService:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client
        
    async def analyze(self, request: PaxAnalyzeRequest) -> PaxAnalyzeResponse:
        start_time = time.time()
        
        # Determine mode-based prompt
        if request.mode == "input":
            target_version = "pax_v4_input"
        else:
            target_version = "pax_v4_output"
            
        version, prompt_text = PromptService.get_prompt(target_version)
        
        try:
            logger.info(f"Analyzing text for mode: {request.mode} using version: {version}")
            
            output_text, tokens_used = await self.llm_client.generate_completion(
                system_prompt=prompt_text,
                user_text=request.text
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            return PaxAnalyzeResponse(
                pax=output_text.strip(),
                prompt_version=version,
                model=self.llm_client.model_name,
                latency_ms=latency_ms,
                tokens_used=tokens_used
            )
        except Exception as e:
            logger.error(f"Error during analysis: {str(e)}")
            latency_ms = int((time.time() - start_time) * 1000)
            return PaxAnalyzeResponse(
                pax="Analysis failed.",
                prompt_version=version if 'version' in locals() else "unknown",
                model=self.llm_client.model_name,
                latency_ms=latency_ms,
                tokens_used=0,
                error=str(e)
            )
