"""
Pydantic schemas for snippet-related requests/responses.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SnippetBase(BaseModel):
    """Base snippet schema"""
    name: str
    description: Optional[str] = None
    content: str
    folder_id: Optional[str] = None


class SnippetCreate(SnippetBase):
    """Create snippet"""
    pass


class SnippetUpdate(BaseModel):
    """Update snippet"""
    name: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    folder_id: Optional[str] = None


class SnippetResponse(SnippetBase):
    """Snippet response"""
    id: str
    workspace_id: str
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FolderBase(BaseModel):
    """Base folder schema"""
    name: str
    description: Optional[str] = None


class FolderCreate(FolderBase):
    """Create folder"""
    pass


class FolderUpdate(BaseModel):
    """Update folder"""
    name: Optional[str] = None
    description: Optional[str] = None


class FolderResponse(FolderBase):
    """Folder response"""
    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
