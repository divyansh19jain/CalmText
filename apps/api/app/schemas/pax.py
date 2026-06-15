from pydantic import BaseModel, Field
from typing import Optional, Literal

class PaxAnalyzeRequest(BaseModel):
    text: str = Field(..., description="The user input text to analyze")
    mode: Literal["input", "output"] = Field(..., description="The context: 'input' for received messages, 'output' for drafting")
    prompt_version: Optional[str] = Field(None, description="Optional specific prompt version to use")

class PaxAnalyzeResponse(BaseModel):
    pax: str
    subtext: str = ""
    prompt_version: str
    model: str
    latency_ms: int
    tokens_used: int
    error: str = ""

class ClearTextRequest(BaseModel):
    text: str

class ClearTextResponse(BaseModel):
    feedback: str
    latency_ms: int

class OwnVoiceRequest(BaseModel):
    voice_sample: str = Field(..., description="Examples of how the user writes, used to capture their voice")
    intent: str = Field(..., description="What the user wants to say in the new message")

class OwnVoiceResponse(BaseModel):
    message: str
    latency_ms: int

class PaxFeedbackRequest(BaseModel):
    text: str
    pax: str
    prompt_version: str
    helpful: bool

class PaxFeedbackResponse(BaseModel):
    success: bool
