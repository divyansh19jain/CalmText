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
        # Default to multi_v1 if no version specified
        target_version = request.prompt_version or "multi_v1"
        version, prompt_text = PromptService.get_prompt(target_version)
        
        try:
            logger.info(f"Analyzing text using prompt version: {version}")
            
            output_text, tokens_used = await self.llm_client.generate_completion(
                system_prompt=prompt_text,
                user_text=request.text
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Handle multi-variant case
            if version == "multi_v1":
                try:
                    # Strip potential markdown formatting if LLM includes it
                    cleaned_output = output_text.strip()
                    if cleaned_output.startswith("```json"):
                        cleaned_output = cleaned_output[7:-3].strip()
                    elif cleaned_output.startswith("```"):
                        cleaned_output = cleaned_output[3:-3].strip()
                        
                    data = json.loads(cleaned_output)
                    return PaxAnalyzeResponse(
                        pax=data.get("pax", ""),
                        clear_text=data.get("clear_text", ""),
                        pro_text=data.get("pro_text", ""),
                        sub_text=data.get("sub_text", ""),
                        prompt_version=version,
                        model=self.llm_client.model_name,
                        latency_ms=latency_ms,
                        tokens_used=tokens_used
                    )
                except json.JSONDecodeError:
                    logger.warning("Failed to parse multi-variant JSON, falling back to raw output")
                    return PaxAnalyzeResponse(
                        pax=output_text,
                        prompt_version=version,
                        model=self.llm_client.model_name,
                        latency_ms=latency_ms,
                        tokens_used=tokens_used,
                        error="JSON parsing failed"
                    )

            # Standard single-variant case
            return PaxAnalyzeResponse(
                pax=output_text,
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
                prompt_version=version,
                model=self.llm_client.model_name,
                latency_ms=latency_ms,
                tokens_used=0,
                error=str(e)
            )
