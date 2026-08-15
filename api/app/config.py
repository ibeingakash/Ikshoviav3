import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application configuration and environment settings."""
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "api/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "IKSHOVIA Data API"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = Field(default="development", validation_alias="APP_ENV")
    DEBUG: bool = Field(default=True, validation_alias="DEBUG")
    API_V1_PREFIX: str = Field(default="/api/v1", validation_alias="API_V1_PREFIX")
    
    HOST: str = "0.0.0.0"
    PORT: int = Field(default=8001, validation_alias="FASTAPI_PORT")

    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/ikshovia",
        validation_alias="DATABASE_URL",
    )
    SYNC_DATABASE_URL: Optional[str] = Field(
        default=None,
        validation_alias="SYNC_DATABASE_URL",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_async_db_url(cls, v: Optional[str]) -> str:
        if not v:
            # Fallback to POSTGRES_URL or default
            v = os.environ.get("POSTGRES_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/ikshovia")
        
        # Convert standard postgresql:// or postgres:// to asyncpg dialect if not specified
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    def get_sync_database_url(self) -> str:
        if self.SYNC_DATABASE_URL:
            url = self.SYNC_DATABASE_URL
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            elif "+asyncpg" in url:
                url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
            return url
        # Strip asyncpg for sync driver (Alembic / psycopg2)
        return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")


settings = Settings()
