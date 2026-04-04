"""
Configuration settings for FastAPI application.
Reads from environment variables via .env files.
"""

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Database
    database_url: str = "mysql+mysqlconnector://test_user:test_password@localhost:3306/promptoria_test"

    # JWT
    jwt_secret: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_days: int = 7

    # API Keys
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None

    # Environment
    environment: str = "development"
    debug: bool = True

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3100", "https://syncellium.pro"]

    class Config:
        env_file = ".env.local"
        env_file_encoding = 'utf-8'
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from environment

# Global settings instance
settings = Settings()
