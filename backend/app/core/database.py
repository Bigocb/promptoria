"""
SQLAlchemy database configuration and session management.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool, StaticPool

from .config import settings

# Use MySQL in production (via DATABASE_URL env var), SQLite in development
# DATABASE_URL must be explicitly set in Render's environment variables
# If not set, defaults to local SQLite for development

db_url = os.getenv('DATABASE_URL')  # Read directly from environment
print(f"DEBUG: DATABASE_URL from env = {db_url}")
print(f"DEBUG: settings.database_url = {settings.database_url}")

# Prefer environment variable over settings
if db_url and "mysql" in db_url:
    DB_URL = db_url
    print("DEBUG: Using MySQL from DATABASE_URL env var")
    engine = create_engine(
        DB_URL,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        echo=settings.debug
    )
elif settings.database_url and "mysql" in settings.database_url:
    DB_URL = settings.database_url
    print("DEBUG: Using MySQL from settings")
    engine = create_engine(
        DB_URL,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        echo=settings.debug
    )
else:
    # Fall back to SQLite for local development
    DB_URL = "sqlite:///./promptoria.db"
    print("DEBUG: Using SQLite for development")
    engine = create_engine(
        DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=settings.debug
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Import Base from models - this is the declarative base that all models use
from ..models.base import Base

def get_db():
    """
    Dependency to get database session.
    Usage in route handlers:
        @app.get("/")
        def read_root(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
