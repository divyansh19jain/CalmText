from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter()

class ProfileResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    username: Optional[str] = None
    mobile: Optional[str] = None

    model_config = {"from_attributes": True}

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    mobile: Optional[str] = None

@router.get("", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return ProfileResponse.model_validate(current_user)

@router.put("", response_model=ProfileResponse)
async def update_profile(
    body: ProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.username and body.username != current_user.username:
        result = await db.execute(select(User).where(User.username == body.username))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")

    if body.name is not None:
        current_user.name = body.name
    if body.username is not None:
        current_user.username = body.username
    if body.mobile is not None:
        current_user.mobile = body.mobile

    await db.commit()
    await db.refresh(current_user)
    return ProfileResponse.model_validate(current_user)
