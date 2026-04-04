"""
CRUD operations for Prompt and PromptVersion models.
"""

from uuid import uuid4
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models import Prompt, PromptVersion, PromptComposition


def create_prompt(
    db: Session,
    workspace_id: str,
    name: str,
    template_body: str,
    description: str = None,
    folder_id: str = None,
    category_id: str = None,
    tags: list = None,
    model: str = None,
) -> Prompt:
    """Create a new prompt with initial version"""
    prompt_id = str(uuid4())

    # Create prompt
    prompt = Prompt(
        id=prompt_id,
        name=name,
        description=description,
        workspace_id=workspace_id,
        folder_id=folder_id,
        category_id=category_id,
        tags=tags or [],
        model=model,
    )
    db.add(prompt)

    # Create initial version (v1)
    version = PromptVersion(
        id=str(uuid4()),
        prompt_id=prompt_id,
        version_number=1,
        template_body=template_body,
        is_active=True,
    )
    db.add(version)

    db.commit()
    db.refresh(prompt)
    return prompt


def get_prompt(db: Session, prompt_id: str, workspace_id: str) -> Prompt | None:
    """Get prompt by ID (with workspace check)"""
    return db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.workspace_id == workspace_id
    ).first()


def get_prompts(db: Session, workspace_id: str, skip: int = 0, limit: int = 100) -> list:
    """List all prompts for workspace"""
    return db.query(Prompt).filter(
        Prompt.workspace_id == workspace_id
    ).offset(skip).limit(limit).all()


def update_prompt(
    db: Session,
    prompt_id: str,
    workspace_id: str,
    **kwargs
) -> Prompt | None:
    """Update prompt metadata"""
    prompt = get_prompt(db, prompt_id, workspace_id)
    if not prompt:
        return None

    # Update only provided fields
    for key, value in kwargs.items():
        if value is not None and hasattr(prompt, key):
            setattr(prompt, key, value)

    db.commit()
    db.refresh(prompt)
    return prompt


def delete_prompt(db: Session, prompt_id: str, workspace_id: str) -> bool:
    """Delete prompt (cascades to versions and test runs)"""
    prompt = get_prompt(db, prompt_id, workspace_id)
    if not prompt:
        return False

    db.delete(prompt)
    db.commit()
    return True


def create_version(
    db: Session,
    prompt_id: str,
    template_body: str,
    model_config: dict = None,
) -> PromptVersion:
    """Create new version of a prompt"""
    # Get current max version number
    max_version = db.query(PromptVersion).filter(
        PromptVersion.prompt_id == prompt_id
    ).count()

    version = PromptVersion(
        id=str(uuid4()),
        prompt_id=prompt_id,
        version_number=max_version + 1,
        template_body=template_body,
        model_config=model_config,
        is_active=True,
    )
    db.add(version)

    # Deactivate previous versions
    db.query(PromptVersion).filter(
        PromptVersion.prompt_id == prompt_id,
        PromptVersion.id != version.id,
    ).update({"is_active": False})

    db.commit()
    db.refresh(version)
    return version


def get_prompt_versions(db: Session, prompt_id: str) -> list:
    """Get all versions of a prompt"""
    return db.query(PromptVersion).filter(
        PromptVersion.prompt_id == prompt_id
    ).order_by(PromptVersion.version_number.desc()).all()
