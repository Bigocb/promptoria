"""
CRUD operations for User model.
"""

from uuid import uuid4
from sqlalchemy.orm import Session

from ..models import User, UserSettings, Workspace, AgentInteractionType
from ..core.security import hash_password, verify_password


def create_user(db: Session, email: str, password: str) -> User:
    """
    Create a new user with email and password.
    Also creates default UserSettings and Workspace.
    """
    user_id = str(uuid4())

    # Hash password
    password_hash = hash_password(password)

    # Create user
    user = User(
        id=user_id,
        email=email,
        password=password_hash
    )
    db.add(user)

    # Create user settings
    settings = UserSettings(
        id=str(uuid4()),
        user_id=user_id,
        theme="gruvbox-dark",
        suggestions_enabled=True,
        default_model="gpt-oss:120b-cloud",
        default_temperature=0.7,
        default_max_tokens=500
    )
    db.add(settings)

    # Create workspace (1:1 with user)
    workspace = Workspace(
        id=str(uuid4()),
        name=f"{email.split('@')[0]}'s Workspace",
        slug=f"workspace-{user_id[:8]}",
        user_id=user_id
    )
    db.add(workspace)
    db.flush()  # Flush to get workspace.id for the interaction types

    # Create default interaction types
    default_types = [
        {
            "name": "Instructions",
            "emoji": "📝",
            "description": "Step-by-step guides and instructional prompts"
        },
        {
            "name": "Prompts",
            "emoji": "💬",
            "description": "Conversation starters and prompt templates"
        },
        {
            "name": "Skills",
            "emoji": "⚙️",
            "description": "Task-specific prompts for skill development"
        },
        {
            "name": "Other",
            "emoji": "📌",
            "description": "Miscellaneous prompts and templates"
        }
    ]

    for type_data in default_types:
        interaction_type = AgentInteractionType(
            id=str(uuid4()),
            name=type_data["name"],
            emoji=type_data["emoji"],
            description=type_data["description"],
            workspace_id=workspace.id
        )
        db.add(interaction_type)

    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> User | None:
    """Get user by email address"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: str) -> User | None:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Authenticate user with email and password"""
    user = get_user_by_email(db, email)
    if not user:
        return None

    if not verify_password(password, user.password):
        return None

    return user


def user_exists(db: Session, email: str) -> bool:
    """Check if user with email exists"""
    return db.query(User).filter(User.email == email).first() is not None


def update_user_settings(db: Session, user_id: str, **kwargs) -> UserSettings:
    """Update user settings"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()

    if not settings:
        raise ValueError(f"Settings not found for user {user_id}")

    # Update only provided fields
    for key, value in kwargs.items():
        if value is not None and hasattr(settings, key):
            setattr(settings, key, value)

    db.commit()
    db.refresh(settings)
    return settings
