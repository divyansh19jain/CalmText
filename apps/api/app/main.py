import sys
import os
from pathlib import Path

# Fix module resolution when running from root
current_dir = Path(__file__).resolve().parent
if str(current_dir.parent) not in sys.path:
    sys.path.insert(0, str(current_dir.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.routes import health, pax, auth, history, profile, payments
from app.db.base import Base
from app.db.session import engine
import app.models.user  # noqa: ensure models are registered
import app.models.history  # noqa: ensure models are registered

# Setup environment basics
setup_logging(debug=settings.debug)

# Initialize application
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
)

# CORS handling
origins = settings.cors_origins
if isinstance(origins, str):
    origins = [origin.strip() for origin in origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def create_tables():
    from sqlalchemy import text
    from app.core.logging import logger
    logger.info(f"DATABASE_URL: {settings.database_url}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Lightweight idempotent migrations: create_all does not add new
        # columns to tables that already exist, so patch them here.
        await conn.execute(text(
            "ALTER TABLE search_history "
            "ADD COLUMN IF NOT EXISTS conversation_id VARCHAR(64)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_search_history_conversation_id "
            "ON search_history (conversation_id)"
        ))
        await conn.execute(text(
            "ALTER TABLE users "
            "ADD COLUMN IF NOT EXISTS has_unlimited_search_access BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        await conn.execute(text(
            "ALTER TABLE users "
            "ADD COLUMN IF NOT EXISTS search_count INTEGER NOT NULL DEFAULT 0"
        ))
        # Stripe subscription columns
        await conn.execute(text(
            "ALTER TABLE users "
            "ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)"
        ))
        await conn.execute(text(
            "ALTER TABLE users "
            "ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255)"
        ))
        await conn.execute(text(
            "ALTER TABLE users "
            "ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50)"
        ))
        await conn.execute(text(
            "ALTER TABLE users "
            "ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50)"
        ))
        result = await conn.execute(text("SELECT COUNT(*) FROM users"))
        user_count = result.scalar()
        result2 = await conn.execute(text("SELECT COUNT(*) FROM search_history"))
        history_count = result2.scalar()
        logger.info(f"DB STATE ON STARTUP: {user_count} users, {history_count} history records")

    # Enforce unique mobile numbers (partial index allows multiple NULLs for
    # legacy rows). Best-effort: skip if existing duplicates block creation so
    # startup never crashes — the signup route enforces uniqueness regardless.
    from app.core.logging import logger as _logger
    try:
        async with engine.begin() as conn:
            await conn.execute(text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_users_mobile "
                "ON users (mobile) WHERE mobile IS NOT NULL"
            ))
    except Exception as e:
        _logger.warning(f"Could not create unique index on users.mobile (existing duplicates?): {e}")

# Configure routing
@app.get("/")
async def root():
    return {"message": "CalmText API is live"}

app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(pax.router, prefix="/api/v1/pax", tags=["Pax"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(history.router, prefix="/api/v1/history", tags=["History"])
app.include_router(profile.router, prefix="/api/v1/profile", tags=["Profile"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])
