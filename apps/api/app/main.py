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
from app.api.v1.routes import health, pax

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

# Configure routing
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(pax.router, prefix="/api/v1/pax", tags=["Pax"])
