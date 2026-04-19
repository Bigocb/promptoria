"""
Pydantic schemas for prompt-related requests/responses.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class PromptVersionBase(BaseModel):
    """Base prompt version schema"""
    model_config = ConfigDict(populate_by_name=True)

    template_body: str
    config: Optional[dict] = Field(None, alias='model_config')
    is_active: bool = True


class PromptVersionCreate(PromptVersionBase):
    """Create prompt version"""
    pass


class PromptVersionResponse(PromptVersionBase):
    """Prompt version response"""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    prompt_id: str
    version_number: int
    created_at: datetime
    updated_at: datetime


class PromptBase(BaseModel):
    """Base prompt schema"""
    name: str
    description: Optional[str] = None
    folder_id: Optional[str] = None
    category_id: Optional[str] = None
    tags: Optional[List[str]] = None
    model: Optional[str] = None


class PromptCreate(PromptBase):
    """Create prompt with initial version"""
    template_body: str  # Initial version body


class PromptUpdate(BaseModel):
    """Update prompt metadata and/or content"""
    name: Optional[str] = None
    description: Optional[str] = None
    folder_id: Optional[str] = None
    category_id: Optional[str] = None
    tags: Optional[List[str]] = None
    model: Optional[str] = None
    template_body: Optional[str] = None  # If provided, creates new version


class PromptResponse(PromptBase):
    """Prompt response"""
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime


class PromptDetailResponse(PromptResponse):
    """Prompt with all versions"""
    versions: List[PromptVersionResponse]


class PromptCompositionResponse(BaseModel):
    """Prompt composition (snippet reference)"""
    model_config = ConfigDict(from_attributes=True)

    id: str
    prompt_version_id: str
    snippet_id: str
    rank: int
