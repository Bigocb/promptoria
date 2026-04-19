"""
Configuration settings for FastAPI application.
Reads from environment variables via .env files.
"""

import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Database - DATABASE_URL is set by Render for PostgreSQL, or omitted for local SQLite
    database_url: Optional[str] = None  # Will be set by Render or omitted for dev

    # JWT
    jwt_secret: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_days: int = 7

    # API Keys
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None

    # Ollama - can be local or cloud
    ollama_endpoint: str = "http://localhost:11434"
    ollama_api_key: Optional[str] = None  # Required for cloud models at ollama.com
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

# CORS origins - read from env var or use defaults
cors_env = os.getenv("CORS_ORIGINS", "")
if cors_env:
    # Parse comma-separated list from environment
    settings.cors_origins = [origin.strip() for origin in cors_env.split(",")]
else:
    # Default origins for development
    settings.cors_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3100",
        "https://syncellium.pro",
        "https://promptoria-dev.vercel.app",
        "https://promptoria.onrender.com",
        "https://promptoria-api.onrender.com",
    ]
