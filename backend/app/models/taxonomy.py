"""
Taxonomy models: AgentInteractionType and PromptCategory.
Creates a 2-level hierarchy for organizing prompts.
"""

from sqlalchemy import Column, String, Text, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

class AgentInteractionType(BaseModel):
    """Top-level category (e.g., 'Research', 'Code Generation')"""
    __tablename__ = "agent_interaction_types"

    id = Column(String(36), primary_key=True)  # CUID
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    emoji = Column(String(10), nullable=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="interaction_types")
    categories = relationship("PromptCategory", back_populates="interaction_type", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_interaction_type_workspace', 'workspace_id'),
        Index('idx_interaction_type_name_unique', 'workspace_id', 'name', unique=True),
    )


class PromptCategory(BaseModel):
    """Subcategory under an AgentInteractionType"""
    __tablename__ = "prompt_categories"

    id = Column(String(36), primary_key=True)  # CUID
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_interaction_type_id = Column(String(36), ForeignKey("agent_interaction_types.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="prompt_categories")
    interaction_type = relationship("AgentInteractionType", back_populates="categories")
    prompts = relationship("Prompt", back_populates="category")

    # Indexes
    __table_args__ = (
        Index('idx_category_workspace', 'workspace_id'),
        Index('idx_category_interaction_type', 'agent_interaction_type_id'),
        Index('idx_category_name_unique', 'workspace_id', 'name', unique=True),
    )
