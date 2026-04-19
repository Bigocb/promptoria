"""
Security utilities: JWT token generation/verification and password hashing.
Must match Node.js implementation exactly for token compatibility.
"""

import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends, Header

from .config import settings

class JWTPayload:
    """JWT token payload structure - matches Node.js implementation"""
    def __init__(self, user_id: str, email: str):
        self.user_id = user_id
        self.email = email
        self.iat = datetime.now(timezone.utc).timestamp()
        self.exp = (datetime.now(timezone.utc) +
                   timedelta(days=settings.jwt_expiration_days)).timestamp()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "userId": self.user_id,
            "email": self.email,
            "iat": int(self.iat),
            "exp": int(self.exp)
        }


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt with salt=10.
    Matches Node.js bcryptjs implementation.
    """
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against bcrypt hash.
    Matches Node.js bcryptjs implementation.
    """
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(user_id: str, email: str) -> str:
    """
    Create JWT access token.
    Matches Node.js jwt.sign implementation.
    """
    payload = JWTPayload(user_id, email)
    token = jwt.encode(
        payload.to_dict(),
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )
    return token


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode JWT token.
    Matches Node.js jwt.verify implementation.
    Returns decoded payload or None if invalid.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def extract_token_from_header(auth_header: Optional[str]) -> Optional[str]:
    """
    Extract Bearer token from Authorization header.
    Format: "Bearer {token}"
    """
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


def is_valid_email(email: str) -> bool:
    r"""
    Simple email validation.
    Matches Node.js regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    """
    import re
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return bool(re.match(pattern, email))


def is_strong_password(password: str) -> bool:
    """
    Validate password strength.
    Requirements: min 8 chars, uppercase, lowercase, digit.
    Matches Node.js implementation.
    """
    if len(password) < 8:
        return False
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    return has_upper and has_lower and has_digit


async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    FastAPI dependency to extract and verify JWT token from Authorization header.
    Returns user_id if token is valid, raises 401 otherwise.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )

    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )

    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id = payload.get("userId")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    return user_id
