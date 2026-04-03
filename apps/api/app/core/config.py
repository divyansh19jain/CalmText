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
    anthropic_model_name: str = "claude-3-haiku-20240307"
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
