from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_ALLOWED_ORIGINS = "http://localhost:5173,https://medivoice.example.com"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"
    database_url: str = "sqlite:///./data/medivoice.db"
    max_upload_mb: int = 10
    max_images: int = 5

    # Comma-separated list of allowed CORS origins. Never use "*".
    allowed_origins: str = DEFAULT_ALLOWED_ORIGINS

    # Shared secret required in the X-Demo-Passcode header.
    demo_passcode: str = "MEDIVOICE2026"

    @property
    def allowed_origin_list(self) -> list[str]:
        origins = [
            origin.strip()
            for origin in self.allowed_origins.split(",")
            if origin.strip()
        ]
        # Defense in depth: a wildcard would defeat the whole point of CORS.
        return [origin for origin in origins if origin != "*"]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


settings = Settings()
