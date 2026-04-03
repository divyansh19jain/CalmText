from fastapi import APIRouter, Depends
from app.schemas.pax import PaxAnalyzeRequest, PaxAnalyzeResponse, PaxFeedbackRequest, PaxFeedbackResponse
from app.services.pax_service import PaxService
from app.services.feedback_service import FeedbackService
from app.core.dependencies import get_llm_client
from app.clients.llm_client import LLMClient

router = APIRouter()

@router.post("/analyze", response_model=PaxAnalyzeResponse)
async def analyze_pax(
    request: PaxAnalyzeRequest,
    llm_client: LLMClient = Depends(get_llm_client)
):
    service = PaxService(llm_client)
    return await service.analyze(request)

@router.post("/feedback", response_model=PaxFeedbackResponse)
async def submit_feedback(request: PaxFeedbackRequest):
    service = FeedbackService()
    return await service.record_feedback(request)
