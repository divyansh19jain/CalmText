from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import SignupRequest, SigninRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.core.otp_store import generate_otp, verify_otp
from app.core.email_service import send_otp_email

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

class SendResetCodeRequest(BaseModel):
    email: EmailStr

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

router = APIRouter()

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    if body.username:
        dup = await db.execute(select(User).where(User.username == body.username))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        username=body.username,
        mobile=body.mobile,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.id),
        user_id=user.id,
        email=user.email,
        name=user.name,
        username=user.username,
    )

@router.post("/signin", response_model=TokenResponse)
async def signin(body: SigninRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return TokenResponse(
        access_token=create_access_token(user.id),
        user_id=user.id,
        email=user.email,
        name=user.name,
        username=user.username,
    )

@router.post("/reset-password", status_code=200)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user.hashed_password = hash_password(body.new_password)
    await db.commit()
    return {"message": "Password reset successful"}


@router.post("/send-reset-code", status_code=200)
async def send_reset_code(body: SendResetCodeRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="No account found with this email")

    otp = generate_otp(body.email)
    try:
        await send_otp_email(body.email, otp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

    return {"message": "Reset code sent to your email"}


@router.post("/verify-reset-code", status_code=200)
async def verify_reset_code(body: VerifyResetCodeRequest, db: AsyncSession = Depends(get_db)):
    if not verify_otp(body.email, body.code):
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user.hashed_password = hash_password(body.new_password)
    await db.commit()
    return {"message": "Password reset successful"}
