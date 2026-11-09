from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    BOT_TOKEN: str = "123456789:AAFakeTokenForLocalDevelopmentTestingMockOnly"
    MOCK_AUTH_MODE: bool = True
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DATABASE_URL: str = "sqlite+aiosqlite:///./zero_credit.db"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
