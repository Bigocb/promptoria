"""
Pydantic schemas for prompt-related requests/responses.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PromptVersionBase(BaseModel):
    """Base prompt version schema"""
    template_body: str
    model_config: Optional[dict] = None
    is_active: bool = True


class PromptVersionCreate(PromptVersionBase):
    """Create prompt version"""
    pass


class PromptVersionResponse(PromptVersionBase):
    """Prompt version response"""
    id: str
    prompt_id: str
    version_number: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


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
    """Update prompt metadata"""
    name: Optional[str] = None
    description: Optional[str] = None
    folder_id: Optional[str] = None
    category_id: Optional[str] = None
    tags: Optional[List[str]] = None
    model: Optional[str] = None


class PromptResponse(PromptBase):
    """Prompt response"""
    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PromptDetailResponse(PromptResponse):
    """Prompt with all versions"""
    versions: List[PromptVersionResponse]


class PromptCompositionResponse(BaseModel):
    """Prompt composition (snippet reference)"""
    id: str
    prompt_version_id: str
    snippet_id: str
    rank: int

    class Config:
        from_attributes = True
