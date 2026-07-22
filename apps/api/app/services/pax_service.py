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

        if request.mode != "input":
            return await self._gut_check(request, start_time)

        version, pax_prompt = PromptService.get_prompt("pax_v4_input")
        _, subtext_prompt = PromptService.get_prompt("subtext_v1_input")

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
            # Re-raise quota exhaustion errors so they can be handled properly
            error_str = str(e).lower()
            if 'insufficient_quota' in error_str or '429' in error_str:
                raise
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

    async def _gut_check(self, request: PaxAnalyzeRequest, start_time: float) -> PaxAnalyzeResponse:
        """Reply loop (client spec): the user enters their reply, PAX runs a
        gut check first; only if the writer is heated does PAX de-escalate
        with a calming PAXism. SubText stays alongside, reading how the
        draft may land. PAX never writes the message."""
        version, gut_prompt = PromptService.get_prompt("pax_gutcheck_v1")
        _, subtext_prompt = PromptService.get_prompt("subtext_v1_output")

        try:
            logger.info(f"Gut-checking reply using version: {version}")
            (raw, gut_tokens), (subtext_text, subtext_tokens) = await asyncio.gather(
                self.llm_client.generate_completion(system_prompt=gut_prompt, user_text=request.text),
                self.llm_client.generate_completion(system_prompt=subtext_prompt, user_text=request.text),
            )

            gut, instinct, paxism = self._parse_gut_check(raw)
            latency_ms = int((time.time() - start_time) * 1000)

            return PaxAnalyzeResponse(
                pax=instinct,
                subtext=subtext_text.strip(),
                gut=gut,
                paxism=paxism,
                prompt_version=version,
                model=self.llm_client.model_name,
                latency_ms=latency_ms,
                tokens_used=gut_tokens + subtext_tokens,
            )
        except Exception as e:
            logger.error(f"Error during gut check: {str(e)}")
            error_str = str(e).lower()
            if 'insufficient_quota' in error_str or '429' in error_str:
                raise
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

    @staticmethod
    def _parse_gut_check(raw: str) -> tuple[str, str, str]:
        """Split the model output into (gut, instinct line, paxism).

        Expected shape:
            GUT: CALM|HEATED
            <one dog-body line>
            <PAXism, only when heated>
        Falls back to treating the whole text as the instinct line.
        """
        lines = [ln.strip() for ln in raw.strip().splitlines() if ln.strip()]
        gut = ""
        if lines and lines[0].upper().startswith("GUT:"):
            gut = "heated" if "HEATED" in lines[0].upper() else "calm"
            lines = lines[1:]

        instinct = lines[0] if lines else raw.strip()
        paxism = " ".join(lines[1:]) if len(lines) > 1 else ""
        return gut, instinct, paxism
