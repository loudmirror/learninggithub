"""Application configuration."""
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "LearningGitHub API"
    app_version: str = "0.1.0"
    debug: bool = False

    # API
    api_prefix: str = "/api"

    # CORS
    cors_origins: List[str] = ["http://localhost:3000"]

    # Logging
    log_level: str = "INFO"

    # GitHub API Configuration
    github_token: Optional[str] = None
    github_api_base_url: str = "https://api.github.com"

    # AI Model Configuration
    ai_provider: str = "openai"
    openai_api_key: Optional[str] = None
    openai_base_url: Optional[str] = None  # 支持 OpenRouter 等兼容 API
    openai_model: str = "gpt-4-turbo-preview"

    # Cache Configuration
    cache_enabled: bool = True
    cache_ttl: int = 3600  # 1 hour in seconds

    # Rate Limiting (for future use)
    rate_limit_enabled: bool = False
    rate_limit_requests: int = 100  # requests per window
    rate_limit_window: int = 60  # window in seconds

    # Production Security
    trusted_hosts: List[str] = ["*"]

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return not self.debug

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()
