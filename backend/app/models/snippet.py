"""
Snippet and Folder models.
Snippets are reusable text blocks that can be composed into prompts.
"""

from sqlalchemy import Column, String, Text, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship

from .base import BaseModel

class Folder(BaseModel):
    """Folder for organizing prompts and snippets"""
    __tablename__ = "folders"

    id = Column(String(36), primary_key=True)  # CUID
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="folders")
    prompts = relationship("Prompt", back_populates="folder")
    snippets = relationship("Snippet", back_populates="folder")

    # Indexes
    __table_args__ = (
        Index('idx_folder_workspace_id', 'workspace_id'),
    )


class Snippet(BaseModel):
    """Reusable text block that can be composed into prompts"""
    __tablename__ = "snippets"

    id = Column(String(36), primary_key=True)  # CUID
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_id = Column(String(36), ForeignKey("folders.id", ondelete="SET NULL"), nullable=True, index=True)
    version = Column(Integer, default=1)

    # Relationships
    workspace = relationship("Workspace", back_populates="snippets")
    folder = relationship("Folder", back_populates="snippets")
    compositions = relationship("PromptComposition", back_populates="snippet", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_snippet_workspace_id', 'workspace_id'),
        Index('idx_snippet_folder_id', 'folder_id'),
        Index('idx_snippet_name_workspace', 'workspace_id', 'name', unique=True),
    )
