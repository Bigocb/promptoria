"""
Workspace model - top-level organizational unit per user.
Each user has exactly one workspace (1:1 relationship).
"""

from sqlalchemy import Column, String, ForeignKey, Index
from sqlalchemy.orm import relationship

from .base import BaseModel

class Workspace(BaseModel):
    """Workspace model - container for all user data"""
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True)  # CUID
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="workspace")
    prompts = relationship("Prompt", back_populates="workspace", cascade="all, delete-orphan")
    snippets = relationship("Snippet", back_populates="workspace", cascade="all, delete-orphan")
    folders = relationship("Folder", back_populates="workspace", cascade="all, delete-orphan")
    test_runs = relationship("TestRun", back_populates="workspace", cascade="all, delete-orphan")
    interaction_types = relationship("AgentInteractionType", back_populates="workspace", cascade="all, delete-orphan")
    prompt_categories = relationship("PromptCategory", back_populates="workspace", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_workspace_user_id', 'user_id'),
    )
