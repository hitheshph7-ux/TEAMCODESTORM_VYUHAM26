import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True)

    # App
    APP_NAME: str = "VYUHAM"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./vyuham.db"

    # Anthropic
    ANTHROPIC_API_KEY: Optional[str] = None

    # Execution mode: "ai" or "demo"
    EXECUTION_MODE: str = "demo"

    # CORS
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    # Retry
    MAX_RETRY_ATTEMPTS: int = 3

    # LangGraph checkpoint DB
    CHECKPOINT_DB_URL: str = "sqlite:///./vyuham_checkpoints.db"


settings = Settings()
