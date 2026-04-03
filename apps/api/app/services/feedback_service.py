from app.schemas.pax import PaxFeedbackRequest, PaxFeedbackResponse
from app.repositories.feedback_repository import FeedbackRepository

class FeedbackService:
    def __init__(self):
        # In a larger app, this might be injected via dependencies too
        self.repository = FeedbackRepository()
        
    async def record_feedback(self, request: PaxFeedbackRequest) -> PaxFeedbackResponse:
        success = await self.repository.save_feedback(request)
        return PaxFeedbackResponse(success=success)
