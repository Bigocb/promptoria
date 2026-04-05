"""
SQLAlchemy database configuration and session management.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool, StaticPool

from .config import settings

# Use MySQL in production (via settings.database_url), SQLite in development
# Check if we have a MySQL database configured
if settings.database_url and "mysql" in settings.database_url:
    DB_URL = settings.database_url
    # MySQL with connection pooling
    engine = create_engine(
        DB_URL,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        echo=settings.debug
    )
else:
    # Fall back to SQLite for local development (no MySQL required)
    DB_URL = "sqlite:///./promptoria.db"
    # SQLite needs StaticPool for in-memory or thread safety
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
