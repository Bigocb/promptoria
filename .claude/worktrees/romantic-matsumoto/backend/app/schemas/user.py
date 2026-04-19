"""
Pydantic schemas for user-related requests/responses.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr


class UserCreate(UserBase):
    """User creation request"""
    password: str


class UserLogin(UserBase):
    """User login request"""
    password: str


class UserResponse(UserBase):
    """User response (public data only)"""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserSettingsResponse(BaseModel):
    """User settings response"""
    id: str
    user_id: str
    theme: str
    suggestions_enabled: bool
    default_model: str
    default_temperature: float
    default_max_tokens: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserWithSettingsResponse(UserResponse):
    """User with settings (for login response)"""
    settings: UserSettingsResponse


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserWithSettingsResponse


class UpdateSettingsRequest(BaseModel):
    """Update user settings request"""
    theme: Optional[str] = None
    suggestions_enabled: Optional[bool] = Field(None, alias="suggestionsEnabled")
    default_model: Optional[str] = Field(None, alias="defaultModel")
    default_temperature: Optional[float] = Field(None, alias="defaultTemperature")
    default_max_tokens: Optional[int] = Field(None, alias="defaultMaxTokens")
    anthropic_api_key: Optional[str] = None

    class Config:
        populate_by_name = True  # Accept both field name and alias


class SetApiKeyRequest(BaseModel):
    """Set API key request"""
    api_key: str
