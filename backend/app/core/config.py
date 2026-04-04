"""
Configuration settings for FastAPI application.
Reads from environment variables via .env files.
"""

import os
from pydantic import Field, field_validator
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

    # CORS origins
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3100",
        "https://syncellium.pro",
        "https://promptoria-dev.vercel.app"
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        # Handle empty or invalid values from environment
        if isinstance(v, str):
            if not v or v.isspace():
                return [
                    "http://localhost:3000",
                    "http://localhost:3001",
                    "http://localhost:3100",
                    "https://syncellium.pro",
                    "https://promptoria-dev.vercel.app"
                ]
        return v if v else []

    class Config:
        env_file = ".env.local"
        env_file_encoding = 'utf-8'
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from environment

# Global settings instance
settings = Settings()
