from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    username: Mapped[Optional[str]] = mapped_column(String(50), unique=True, nullable=True, index=True)
    mobile: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True, index=True)
    # Search-limit tracking
    has_unlimited_search_access: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    search_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Stripe subscription tracking
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    subscription_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    subscription_plan: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
