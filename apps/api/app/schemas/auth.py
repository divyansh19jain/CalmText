from pydantic import BaseModel, EmailStr
from typing import Optional

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    username: Optional[str] = None
    mobile: Optional[str] = None

class SigninRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    name: Optional[str] = None
    username: Optional[str] = None
