"""Application configuration loaded from environment variables."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database — falls back to local SQLite when DATABASE_URL is empty.
    database_url: str = ""

    # JWT
    jwt_secret_key: str = "change-me-to-a-long-random-secret-string"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 10080  # 7 days

    # OTP
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
        # Railway/Heroku style postgres:// -> postgresql://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    @property
    def cors_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
