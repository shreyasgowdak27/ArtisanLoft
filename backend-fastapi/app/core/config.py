"""Application settings loaded from environment variables / .env file.

Uses pydantic-settings; the app fails fast at startup if a required variable is
missing — better to crash early than to silently use wrong config.
"""

from pathlib import Path
from typing import Annotated

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Postgres async URL — must start with postgresql+asyncpg://
    DATABASE_URL: str

    # Auth (kept for legacy; Phase 3 will switch to Supabase JWT verification)
    JWT_SECRET: str
    JWT_EXPIRE_MINUTES: int = 60

    # CORS
    CORS_ORIGINS: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

    # Supabase (used for Supabase Auth JWT verification)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Optional locally. Production uses this Upstash rediss:// connection URL.
    REDIS_URL: str = ""

    @property
    def supabase_jwks_url(self) -> str:
        base = self.SUPABASE_URL.strip().rstrip("/")
        if base and not base.startswith("http://") and not base.startswith("https://"):
            base = f"https://{base}"
        return f"{base}/auth/v1/.well-known/jwks.json"

    # App
    FRONTEND_URL: str = "http://localhost:3000"
    ENV: str = "development"

    @property
    def is_production(self) -> bool:
        return self.ENV.strip().lower() in ("production", "prod")

    @model_validator(mode="after")
    def adjust_cors_for_environment(self) -> "Settings":
        local_origins = {"http://localhost:3000", "http://127.0.0.1:3000"}
        if self.is_production:
            # In production, remove local origins to keep production CORS strict
            self.CORS_ORIGINS = [
                origin for origin in self.CORS_ORIGINS if origin.rstrip("/") not in local_origins
            ]
        else:
            # In local or dev mode, ensure http://localhost:3000 is always permitted
            if "http://localhost:3000" not in self.CORS_ORIGINS:
                self.CORS_ORIGINS.append("http://localhost:3000")
        return self

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str] | None) -> list[str]:
        if value is None:
            return ["http://localhost:3000"]
        if isinstance(value, str):
            origins = [o.strip() for o in value.split(",") if o.strip()]
            return origins if origins else ["http://localhost:3000"]
        if isinstance(value, list):
            origins = [str(o).strip() for o in value if str(o).strip()]
            return origins if origins else ["http://localhost:3000"]
        return ["http://localhost:3000"]

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def require_asyncpg_scheme(cls, value: str) -> str:
        if not value.startswith("postgresql+asyncpg://"):
            raise ValueError(
                "DATABASE_URL must use the 'postgresql+asyncpg' scheme. "
                "Update your .env to use postgresql+asyncpg://..."
            )
        return value


settings = Settings()

