from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

import time
from app.schemas.pax import PaxAnalyzeRequest, PaxAnalyzeResponse, PaxFeedbackRequest, PaxFeedbackResponse, ClearTextRequest, ClearTextResponse
from app.prompts.pax_variants import CLEARTEXT_V1_PROMPT
from app.services.pax_service import PaxService
from app.services.feedback_service import FeedbackService
from app.core.dependencies import get_llm_client, get_claude_client, get_optional_user
from app.clients.llm_client import LLMClient
from app.db.session import get_db
from app.models.history import SearchHistory

router = APIRouter()

async def _save_history(db: AsyncSession, user, result: PaxAnalyzeResponse, request: PaxAnalyzeRequest):
    if user is None:
        return
    entry = SearchHistory(
        user_id=user.id,
        text=request.text,
        mode=request.mode,
        pax=result.pax,
        subtext=result.subtext,
    )
    db.add(entry)
    await db.commit()

@router.post("/analyze", response_model=PaxAnalyzeResponse)
async def analyze_pax(
    request: PaxAnalyzeRequest,
    llm_client: LLMClient = Depends(get_llm_client),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    service = PaxService(llm_client)
    result = await service.analyze(request)
    await _save_history(db, current_user, result, request)
    return result

@router.post("/analyze/claude", response_model=PaxAnalyzeResponse)
async def analyze_claude(
    request: PaxAnalyzeRequest,
    llm_client: LLMClient = Depends(get_claude_client),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    service = PaxService(llm_client)
    result = await service.analyze(request)
    await _save_history(db, current_user, result, request)
    return result

@router.post("/cleartext", response_model=ClearTextResponse)
async def analyze_cleartext(
    request: ClearTextRequest,
    llm_client: LLMClient = Depends(get_llm_client),
):
    start = time.time()
    feedback, _ = await llm_client.generate_completion(CLEARTEXT_V1_PROMPT, request.text)
    latency_ms = int((time.time() - start) * 1000)
    return ClearTextResponse(feedback=feedback.strip(), latency_ms=latency_ms)

@router.post("/feedback", response_model=PaxFeedbackResponse)
async def submit_feedback(request: PaxFeedbackRequest):
    service = FeedbackService()
    return await service.record_feedback(request)
