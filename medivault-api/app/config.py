"""Application configuration loaded from environment variables."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database — falls back to local SQLite when DATABASE_URL is empty.
    database_url: str = ""

    # Supabase project URL (e.g. https://xxxx.supabase.co).
    # Required for JWKS-based JWT verification (new JWT Signing Keys).
    supabase_url: str = ""

    # Supabase JWT secret — legacy HS256 secret from Project Settings → API.
    # When set, Supabase-issued tokens are verified instead of our own JWTs.
    supabase_jwt_secret: str = ""

    # Our own JWT (used as fallback when supabase_jwt_secret is empty — dev only).
    jwt_secret_key: str = "change-me-to-a-long-random-secret-string"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 10080  # 7 days

    # OTP fallback (dev only — used when Supabase is not configured).
    otp_mode: str = "dev"  # dev | prod
    otp_dev_code: str = "123456"

    # CORS — comma separated list, or "*" for all
    cors_origins: str = "*"

    # App
    environment: str = "production"

    @property
    def sqlalchemy_url(self) -> str:
        url = self.database_url.strip()
        if not url:
            return "sqlite:///./medivault.db"
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    @property
    def cors_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def using_supabase(self) -> bool:
        return bool(self.supabase_jwt_secret.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
