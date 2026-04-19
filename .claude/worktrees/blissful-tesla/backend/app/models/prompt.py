"""
Prompt, PromptVersion, and PromptComposition models.
Implements prompt versioning with immutable snapshots.
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text, JSON, Boolean, Index
from sqlalchemy.orm import relationship

from .base import BaseModel

class Prompt(BaseModel):
    """Prompt template model"""
    __tablename__ = "prompts"

    id = Column(String(36), primary_key=True)  # CUID
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_id = Column(String(36), ForeignKey("folders.id", ondelete="SET NULL"), nullable=True, index=True)
    category_id = Column(String(36), ForeignKey("prompt_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    tags = Column(JSON, default=list)  # List of tags
    model = Column(String(100), default="gpt-4")

    # Relationships
    workspace = relationship("Workspace", back_populates="prompts")
    folder = relationship("Folder", back_populates="prompts")
    category = relationship("PromptCategory", back_populates="prompts")
    versions = relationship("PromptVersion", back_populates="prompt", cascade="all, delete-orphan")
    test_runs = relationship("TestRun", back_populates="prompt", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_prompt_workspace_id', 'workspace_id'),
        Index('idx_prompt_name_workspace', 'workspace_id', 'name', unique=True),
    )


class PromptVersion(BaseModel):
    """Immutable snapshot of a prompt at a specific version"""
    __tablename__ = "prompt_versions"

    id = Column(String(36), primary_key=True)  # CUID
    version_number = Column(Integer, nullable=False)
    prompt_id = Column(String(36), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False, index=True)
    template_body = Column(Text, nullable=False)  # The actual prompt content
    model_config = Column(JSON, default=dict)  # {temperature, maxTokens, topP, etc}
    change_log = Column(Text, nullable=True)
    created_by = Column(String(255), nullable=True)  # User who created version
    is_active = Column(Boolean, default=False)

    # Relationships
    prompt = relationship("Prompt", back_populates="versions")
    snippets = relationship("PromptComposition", back_populates="prompt_version", cascade="all, delete-orphan")
    test_runs = relationship("TestRun", back_populates="prompt_version", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_version_prompt_id', 'prompt_id'),
        Index('idx_version_unique', 'prompt_id', 'version_number', unique=True),
    )


class PromptComposition(BaseModel):
    """Join table: PromptVersion has many Snippets (ordered by rank)"""
    __tablename__ = "prompt_compositions"

    id = Column(String(36), primary_key=True)  # CUID
    prompt_version_id = Column(String(36), ForeignKey("prompt_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    snippet_id = Column(String(36), ForeignKey("snippets.id", ondelete="CASCADE"), nullable=False, index=True)
    rank = Column(Integer, nullable=False)  # Order of snippet in composition (0-indexed)

    # Relationships
    prompt_version = relationship("PromptVersion", back_populates="snippets")
    snippet = relationship("Snippet", back_populates="compositions")

    # Indexes
    __table_args__ = (
        Index('idx_composition_version', 'prompt_version_id'),
        Index('idx_composition_snippet', 'snippet_id'),
        Index('idx_composition_unique', 'prompt_version_id', 'snippet_id', unique=True),
    )
