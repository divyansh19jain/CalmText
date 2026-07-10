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
    mistral_api_key: str = ""
    mistral_model: str = "mistral-small-latest"

    # Model tiers: free-trial users vs. paid subscribers
    openai_free_model: str = "gpt-4o-mini"
    openai_paid_model: str = "gpt-5-mini"

    # Stripe (use TEST / sandbox keys until go-live)
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    # Base URL of the web app; Stripe Checkout redirects back here
    frontend_url: str = "http://localhost:5173"

    # PostgreSQL
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/calmtext"

    # JWT
    jwt_secret: str = "change-this-to-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Gmail SMTP
    gmail_user: str = ""
    gmail_app_password: str = ""

    # Admin Alerts
    admin_email: str = "berichky@gmail.com"
    admin_alert_from_email: str = "paridhigangwaldeveloper@gmail.com"

    class Config:
        env_file = str(Path(__file__).resolve().parent.parent.parent / ".env")
        env_file_encoding = "utf-8"

settings = Settings()
