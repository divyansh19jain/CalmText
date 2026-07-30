import time
import re
import asyncio
from app.schemas.pax import PaxAnalyzeRequest, PaxAnalyzeResponse
from app.services.prompt_service import PromptService
from app.clients.llm_client import LLMClient
from app.core.logging import logger

class PaxService:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    @staticmethod
    def _trim_dog_reaction(text: str) -> str:
        """Keep Pax's reaction to ONE line with at most two observations.

        The prompts ask for this, but a stack of four short sentences reads as
        busy, so cap it here too: take the first two observations and join them
        with "and" if the model separated them into sentences/lines.
        """
        parts = [p.strip() for p in re.split(r"[\n.]+", (text or "")) if p.strip()]
        if not parts:
            return (text or "").strip()
        if len(parts) == 1:
            return f"{parts[0]}."
        first, second = parts[0], parts[1]
        # Already joined by a connector? Keep the model's own phrasing.
        if re.search(r"\b(and|or|but)\b", first, re.IGNORECASE):
            return f"{first}."
        second = second[0].lower() + second[1:] if second else second
        return f"{first} and {second}."

    async def analyze(self, request: PaxAnalyzeRequest) -> PaxAnalyzeResponse:
        start_time = time.time()

        if request.mode != "input":
            return await self._gut_check(request, start_time)

        # A pasted screenshot transcript (lines like "Me:" / "Divyansh Jain:")
        # gets the five-beat conversation read; a single message keeps the
        # original single-message analysis.
        if self._is_conversation(request.text):
            return await self._conversation_read(request, start_time)

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
                pax=self._trim_dog_reaction(pax_text),
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

    async def _conversation_read(self, request: PaxAnalyzeRequest, start_time: float) -> PaxAnalyzeResponse:
        """Whole-conversation read (client spec v5), in five beats:
        Paxism -> Secret Sauce -> Subtext (You / Them) -> Fetch•Sniff•Stay ->
        Your Turn coaching questions. One call so the Paxism and the
        explanation stay consistent with each other. PAX never writes a reply.
        """
        version, prompt = PromptService.get_prompt("pax_conversation_v5")

        try:
            logger.info(f"Reading conversation using version: {version}")
            raw, tokens = await self.llm_client.generate_completion(
                system_prompt=prompt, user_text=request.text
            )

            parsed = self._parse_conversation_read(raw)
            latency_ms = int((time.time() - start_time) * 1000)

            # The Paxism leads, so it is what history and thread views show.
            # `subtext` keeps a plain-text You/Them summary for those views.
            legacy_subtext_lines = []
            if parsed["subtext_you"]:
                legacy_subtext_lines.append("You")
                legacy_subtext_lines += [f"- {l}" for l in parsed["subtext_you"]]
            if parsed["subtext_them"]:
                legacy_subtext_lines.append("Them")
                legacy_subtext_lines += [f"- {l}" for l in parsed["subtext_them"]]

            return PaxAnalyzeResponse(
                pax=parsed["paxism"] or raw.strip(),
                subtext="\n".join(legacy_subtext_lines),
                paxism=parsed["paxism"],
                secret_sauce=parsed["secret_sauce"],
                subtext_you=parsed["subtext_you"],
                subtext_them=parsed["subtext_them"],
                verdict=parsed["verdict"],
                verdict_why=parsed["verdict_why"],
                questions=parsed["questions"],
                prompt_version=version,
                model=self.llm_client.model_name,
                latency_ms=latency_ms,
                tokens_used=tokens,
            )
        except Exception as e:
            logger.error(f"Error during conversation read: {str(e)}")
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

    # Labelled blocks the conversation prompt returns, in order.
    _CONV_LABELS = (
        "PAXISM",
        "SECRET_SAUCE",
        "SUBTEXT_YOU",
        "SUBTEXT_THEM",
        "VERDICT",
        "VERDICT_WHY",
        "QUESTIONS",
    )

    @classmethod
    def _parse_conversation_read(cls, raw: str) -> dict:
        """Split the labelled blocks into fields. Tolerates missing blocks and
        stray markdown/emoji the model may add around the labels."""
        blocks = {label: "" for label in cls._CONV_LABELS}
        current = None
        for line in (raw or "").splitlines():
            stripped = line.strip().lstrip("#*🐾🦴👃🎾✍️ ").strip()
            matched = None
            for label in cls._CONV_LABELS:
                if stripped.upper().startswith(f"{label}:"):
                    matched = label
                    break
            if matched:
                current = matched
                blocks[current] = stripped[len(matched) + 1 :].strip()
            elif current:
                blocks[current] = f"{blocks[current]}\n{line.strip()}".strip()

        def bullets(text: str) -> list[str]:
            items = []
            for ln in text.splitlines():
                ln = ln.strip().lstrip("-•*").strip()
                # Drop a numeric prefix like "1." if the model adds one
                ln = re.sub(r"^\d+[.)]\s*", "", ln)
                if ln:
                    items.append(ln)
            return items

        verdict = ""
        verdict_raw = blocks["VERDICT"].upper()
        for name in ("FETCH", "SNIFF", "STAY"):
            if name in verdict_raw:
                verdict = name.lower()
                break

        return {
            "paxism": " ".join(blocks["PAXISM"].split()),
            "secret_sauce": " ".join(blocks["SECRET_SAUCE"].split()),
            "subtext_you": bullets(blocks["SUBTEXT_YOU"]),
            "subtext_them": bullets(blocks["SUBTEXT_THEM"]),
            "verdict": verdict,
            "verdict_why": " ".join(blocks["VERDICT_WHY"].split()),
            # Exactly three options, even if the model offers more
            "questions": bullets(blocks["QUESTIONS"])[:3],
        }

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

    # A labelled line looks like "Me: ..." or "Divyansh Jain: ..." — a short
    # speaker label (letters, spaces, simple punctuation) followed by ": text".
    _LABEL_RE = re.compile(r"^\s*[A-Za-z][\w .'’-]{0,30}:\s+\S", re.MULTILINE)
    _ME_RE = re.compile(r"^\s*me:\s", re.IGNORECASE | re.MULTILINE)

    @classmethod
    def _is_conversation(cls, text: str) -> bool:
        """True when the text is a pasted chat transcript: at least two
        speaker-labelled lines, including one from "Me". Otherwise it's a
        single message and uses the standard analysis."""
        if not text:
            return False
        labelled = len(cls._LABEL_RE.findall(text))
        return labelled >= 2 and bool(cls._ME_RE.search(text))

    @classmethod
    def _parse_gut_check(cls, raw: str) -> tuple[str, str, str]:
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
        return gut, cls._trim_dog_reaction(instinct), paxism
