"""
Configuration settings for FastAPI application.
Reads from environment variables via .env files.
"""

import os
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

    # Ollama (local LLM, zero configuration)
    ollama_endpoint: str = "http://localhost:11434"
    ollama_default_model: str = "llama3.2"

    # Environment
    environment: str = "development"
    debug: bool = True

    class Config:
        env_file = ".env.local"
        env_file_encoding = 'utf-8'
        case_sensitive = False
        extra = "allow"  # Allow setting extra attributes like cors_origins

# Global settings instance
settings = Settings()

# CORS origins - set as class attribute AFTER instantiation to bypass pydantic-settings env parsing
settings.cors_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3100",
    "https://syncellium.pro",
    "https://promptoria-dev.vercel.app"
]
