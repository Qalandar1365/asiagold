from functools import lru_cache
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    environment: str = Field("dev", env="ENVIRONMENT")
    session_token_secret: str = Field(
        "...",
        env="SESSION_TOKEN_SECRET",
        description="Shared secret between Worker and backend for session tokens",
    )
    database_url: str = Field(
        "postgresql://user:pass@localhost:5432/asiagold",
        env="DATABASE_URL",
    )
    session_token_ttl_minutes: int = Field(15, env="SESSION_TOKEN_TTL_MINUTES")

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    # یادآوری: مقادیر واقعی SESSION_TOKEN_SECRET و DATABASE_URL را در محیط مقداردهی کنید.
    return Settings()
