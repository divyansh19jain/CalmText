import time
import asyncio
from app.schemas.pax import PaxAnalyzeRequest, PaxAnalyzeResponse
from app.services.prompt_service import PromptService
from app.clients.llm_client import LLMClient
from app.core.logging import logger

class PaxService:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    async def analyze(self, request: PaxAnalyzeRequest) -> PaxAnalyzeResponse:
        start_time = time.time()

        if request.mode == "input":
            pax_version = "pax_v4_input"
            subtext_version = "subtext_v1_input"
        else:
            pax_version = "pax_v4_output"
            subtext_version = "subtext_v1_output"

        version, pax_prompt = PromptService.get_prompt(pax_version)
        _, subtext_prompt = PromptService.get_prompt(subtext_version)

        try:
            logger.info(f"Analyzing text for mode: {request.mode} using version: {version}")

            (pax_text, pax_tokens), (subtext_text, subtext_tokens) = await asyncio.gather(
                self.llm_client.generate_completion(system_prompt=pax_prompt, user_text=request.text),
                self.llm_client.generate_completion(system_prompt=subtext_prompt, user_text=request.text),
            )

            latency_ms = int((time.time() - start_time) * 1000)

            return PaxAnalyzeResponse(
                pax=pax_text.strip(),
                subtext=subtext_text.strip(),
                prompt_version=version,
                model=self.llm_client.model_name,
                latency_ms=latency_ms,
                tokens_used=pax_tokens + subtext_tokens,
            )
        except Exception as e:
            logger.error(f"Error during analysis: {str(e)}")
            latency_ms = int((time.time() - start_time) * 1000)
            return PaxAnalyzeResponse(
                pax="Analysis failed.",
                subtext="",
                prompt_version=version if 'version' in locals() else "unknown",
                model=self.llm_client.model_name,
                latency_ms=latency_ms,
                tokens_used=0,
                error=str(e),
            )
