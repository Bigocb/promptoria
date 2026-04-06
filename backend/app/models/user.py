"""
User and UserSettings models.
"""

from sqlalchemy import Column, String, Boolean, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship

from .base import BaseModel

class User(BaseModel):
    """User account model"""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)  # CUID
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="user", uselist=False, cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")


class UserSettings(BaseModel):
    """User preferences and settings model"""
    __tablename__ = "user_settings"

    id = Column(String(36), primary_key=True)  # CUID
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    theme = Column(String(50), default="gruvbox-dark")
    suggestions_enabled = Column(Boolean, default=True)
    default_model = Column(String(100), default="gpt-oss:120b-cloud")
    default_temperature = Column(Float, default=0.7)
    default_max_tokens = Column(Integer, default=500)
    anthropic_api_key = Column(String(1000), nullable=True)  # Encrypted in production

    # Relationships
    user = relationship("User", back_populates="settings")
