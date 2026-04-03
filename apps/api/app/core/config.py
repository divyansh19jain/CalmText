from pydantic_settings import BaseSettings
from typing import List, Union

class Settings(BaseSettings):
    app_name: str = "CalmText API"
    debug: bool = False
    cors_origins: Union[str, List[str]] = ["*"]
    default_prompt_version: str = "pax_v1"
    model_provider: str = "mock"
    openai_api_key: str = ""
    openai_model_name: str = "gpt-4o"
    openai_temperature: float = 1.0
    openai_max_tokens: int = 100

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
