from pydantic import BaseModel, Field
from typing import Optional

class PaxAnalyzeRequest(BaseModel):
    text: str = Field(..., description="The user input text to analyze")
    prompt_version: Optional[str] = Field(None, description="Optional specific prompt version to use")

class PaxAnalyzeResponse(BaseModel):
    pax: str
    prompt_version: str
    model: str
    latency_ms: int
    tokens_used: int
    error: str = ""

class PaxFeedbackRequest(BaseModel):
    text: str
    pax: str
    prompt_version: str
    helpful: bool

class PaxFeedbackResponse(BaseModel):
    success: bool
