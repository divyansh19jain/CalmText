from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List, Union

class Settings(BaseSettings):
    app_name: str = "CalmText API"
    debug: bool = False
    cors_origins: Union[str, List[str]] = ["*"]
    default_prompt_version: str = "pax_v1"
    model_provider: str = "mock"
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # PostgreSQL
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/calmtext"

    # JWT
    jwt_secret: str = "change-this-to-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Gmail SMTP
    gmail_user: str = ""
    gmail_app_password: str = ""

    class Config:
        env_file = str(Path(__file__).resolve().parent.parent.parent / ".env")
        env_file_encoding = "utf-8"

settings = Settings()
