import random
import string
from datetime import datetime, timezone, timedelta

_store: dict = {}  # {email: {"code": str, "expires_at": datetime}}

OTP_EXPIRY_MINUTES = 10


def generate_otp(email: str) -> str:
    code = ''.join(random.choices(string.digits, k=6))
    _store[email] = {
        "code": code,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES),
    }
    return code


def verify_otp(email: str, code: str) -> bool:
    entry = _store.get(email)
    if not entry:
        return False
    if datetime.now(timezone.utc) > entry["expires_at"]:
        del _store[email]
        return False
    if entry["code"] != code:
        return False
    del _store[email]
    return True
