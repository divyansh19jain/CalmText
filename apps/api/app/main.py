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
from app.api.v1.routes import health, pax, auth, history, profile
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
        result = await conn.execute(text("SELECT COUNT(*) FROM users"))
        user_count = result.scalar()
        result2 = await conn.execute(text("SELECT COUNT(*) FROM search_history"))
        history_count = result2.scalar()
        logger.info(f"DB STATE ON STARTUP: {user_count} users, {history_count} history records")

# Configure routing
@app.get("/")
async def root():
    return {"message": "CalmText API is live"}

app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(pax.router, prefix="/api/v1/pax", tags=["Pax"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(history.router, prefix="/api/v1/history", tags=["History"])
app.include_router(profile.router, prefix="/api/v1/profile", tags=["Profile"])
