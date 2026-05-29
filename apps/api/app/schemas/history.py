from pydantic import BaseModel
from datetime import datetime

class HistoryItem(BaseModel):
    id: int
    text: str
    mode: str
    pax: str
    subtext: str
    created_at: datetime

    class Config:
        from_attributes = True

class HistoryListResponse(BaseModel):
    items: list[HistoryItem]
    total: int
