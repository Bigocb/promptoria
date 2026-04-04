"""
Base model class with common fields (created_at, updated_at).
All SQLAlchemy models inherit from this.
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, func
from sqlalchemy.orm import declarative_base

# Declarative base - all models inherit from Base
Base = declarative_base()

class BaseModel(Base):
    """Base class for all models with timestamp fields"""
    __abstract__ = True

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
