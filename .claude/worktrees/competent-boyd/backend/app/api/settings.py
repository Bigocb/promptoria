"""
Settings endpoints: get and update user preferences
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user
from ..schemas.user import UpdateSettingsRequest, UserSettingsResponse
from ..crud.user import update_user_settings
from ..models import User, UserSettings

router = APIRouter()


@router.get("", response_model=UserSettingsResponse)
async def get_settings(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get user settings"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()

    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")

    return settings


@router.post("", response_model=UserSettingsResponse)
async def update_settings(
    data: UpdateSettingsRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Update user settings"""
    settings = update_user_settings(
        db,
        user_id,
        **data.model_dump(exclude_unset=True),
    )

    return settings


@router.post("/api-key")
async def set_api_key(
    data: UpdateSettingsRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Set API key"""
    if not data.anthropic_api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    settings = update_user_settings(
        db,
        user_id,
        anthropic_api_key=data.anthropic_api_key,
    )

    return {"success": True, "message": "API key updated"}
