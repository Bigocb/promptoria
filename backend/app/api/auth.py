"""
Authentication endpoints: login, signup, logout
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token
from app.schemas.user import UserLogin, UserCreate, TokenResponse
from app.crud.user import (
    authenticate_user, create_user, get_user_by_email, user_exists
)
from app.models import UserSettings

router = APIRouter()


@router.post("/login", response_model=TokenResponse, status_code=200)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    Returns JWT access token and user data.
    """
    try:
        print(f"Login attempt for {credentials.email}")
        user = authenticate_user(db, credentials.email, credentials.password)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Get user settings
        settings = db.query(UserSettings).filter(
            UserSettings.user_id == user.id
        ).first()

        # Create JWT token
        access_token = create_access_token(user.id, user.email)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
                "settings": {
                    "id": settings.id,
                    "user_id": settings.user_id,
                    "theme": settings.theme,
                    "suggestions_enabled": settings.suggestions_enabled,
                    "default_model": settings.default_model,
                    "default_temperature": settings.default_temperature,
                    "default_max_tokens": settings.default_max_tokens,
                    "created_at": settings.created_at,
                    "updated_at": settings.updated_at,
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback, sys
        error_msg = traceback.format_exc()
        print(error_msg, file=sys.stderr)
        print(error_msg)
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {str(e)}"
        )


@router.post("/signup", status_code=201)
async def signup(
    data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new user account.
    Returns JWT access token and new user data.
    """
    try:
        print(f"Signup request: {data.email}")  # Debug
        # Check if user already exists
        if user_exists(db, data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )

        # Create user (also creates settings and workspace)
        user = create_user(db, data.email, data.password)

        # Create JWT token
        access_token = create_access_token(user.id, user.email)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "created_at": str(user.created_at),
                "updated_at": str(user.updated_at)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback, sys
        error_msg = traceback.format_exc()
        print(error_msg, file=sys.stderr)
        print(error_msg)
        raise HTTPException(
            status_code=500,
            detail=f"Error: {str(e)}"
        )


@router.post("/logout", status_code=204)
async def logout():
    """
    Logout (invalidate token on client-side).
    JWT tokens cannot be invalidated server-side without a token blacklist.
    Client should delete the token from localStorage.
    """
    return None
