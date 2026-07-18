from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Assetra API"
    environment: str = "local"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://assetra:assetra@localhost:5432/assetra"
    jwt_secret_key: str = "change-me"
    access_token_expire_minutes: int = 60
    session_cookie_name: str = "assetra_session"
    frontend_origin: str = "http://localhost:5173"
    seed_on_startup: bool = False
    tax_rate: float = 18.0
    default_currency: str = "INR"
    default_timezone: str = "Asia/Kolkata"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="ASSETRA_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
