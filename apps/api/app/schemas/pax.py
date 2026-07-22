from pydantic import BaseModel, Field
from typing import Optional, Literal

class PaxAnalyzeRequest(BaseModel):
    text: str = Field(..., description="The user input text to analyze")
    mode: Literal["input", "output"] = Field(..., description="The context: 'input' for received messages, 'output' for drafting")
    prompt_version: Optional[str] = Field(None, description="Optional specific prompt version to use")
    conversation_id: Optional[str] = Field(None, description="Groups an incoming message and its outgoing drafts into one conversation")

class PaxAnalyzeResponse(BaseModel):
    pax: str
    subtext: str = ""
    # Reply gut check (mode="output"): "calm" or "heated", and the calming
    # PAXism that follows a heated gut check. Empty for mode="input".
    gut: str = ""
    paxism: str = ""
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

class PaxCoachRequest(BaseModel):
    text: str = Field(..., description="The draft message the user is stuck on")
    goal: Literal["understanding", "peace", "respect"] = Field(
        ..., description="The communication outcome the user chose"
    )
    answers: Optional[list[str]] = Field(
        None, description="The user's answers to the goal's reflection questions"
    )

class PaxCoachResponse(BaseModel):
    feedback: str
    high_risk: bool = False
    latency_ms: int

class PaxFeedbackRequest(BaseModel):
    text: str
    pax: str
    prompt_version: str
    helpful: bool

class PaxFeedbackResponse(BaseModel):
    success: bool
