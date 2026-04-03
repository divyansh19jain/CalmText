from app.core.logging import logger
from app.schemas.pax import PaxFeedbackRequest

class FeedbackRepository:
    async def save_feedback(self, feedback: PaxFeedbackRequest) -> bool:
        """Placeholder for where we persist feedback records in a database"""
        logger.info(f"Feedback saved - Prompt: {feedback.prompt_version}, Helpful: {feedback.helpful}")
        return True
