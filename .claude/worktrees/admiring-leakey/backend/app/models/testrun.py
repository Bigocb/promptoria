"""
TestRun model.
Stores execution logs for testing prompts against LLMs.
"""

from sqlalchemy import Column, String, Integer, Float, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship

from .base import BaseModel

class TestRun(BaseModel):
    """Execution log for testing a prompt against an LLM"""
    __tablename__ = "test_runs"

    id = Column(String(36), primary_key=True)  # CUID
    prompt_version_id = Column(String(36), ForeignKey("prompt_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    prompt_id = Column(String(36), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Input and execution data
    variables = Column(JSON, default=dict)  # Input variables substituted
    compiled_prompt = Column(Text, nullable=False)  # Final compiled prompt text
    output = Column(Text, nullable=True)  # LLM response
    model = Column(String(100), nullable=True)  # Which model was used

    # Token counts and cost
    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)
    cost_usd = Column(Float, nullable=True)  # Calculated cost

    # Performance and error handling
    latency_ms = Column(Integer, nullable=True)  # API call duration
    status = Column(String(20), default="pending")  # pending, success, error
    error_message = Column(Text, nullable=True)  # If status is error

    # Relationships
    prompt_version = relationship("PromptVersion", back_populates="test_runs")
    prompt = relationship("Prompt", back_populates="test_runs")
    workspace = relationship("Workspace", back_populates="test_runs")

    # Indexes
    __table_args__ = (
        Index('idx_testrun_version', 'prompt_version_id'),
        Index('idx_testrun_prompt', 'prompt_id'),
        Index('idx_testrun_workspace', 'workspace_id'),
    )
