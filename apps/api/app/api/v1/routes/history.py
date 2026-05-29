from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.history import SearchHistory
from app.models.user import User
from app.schemas.history import HistoryListResponse, HistoryItem
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("", response_model=HistoryListResponse)
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SearchHistory)
        .where(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.created_at.desc())
    )
    items = result.scalars().all()
    return HistoryListResponse(
        items=[HistoryItem.model_validate(i) for i in items],
        total=len(items),
    )
