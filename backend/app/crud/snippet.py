"""
CRUD operations for Snippet and Folder models.
"""

from uuid import uuid4
from sqlalchemy.orm import Session

from app.models import Snippet, Folder


def create_folder(db: Session, workspace_id: str, name: str, description: str = None) -> Folder:
    """Create a new folder"""
    folder = Folder(
        id=str(uuid4()),
        name=name,
        description=description,
        workspace_id=workspace_id,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


def get_folder(db: Session, folder_id: str, workspace_id: str) -> Folder | None:
    """Get folder by ID"""
    return db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.workspace_id == workspace_id
    ).first()


def get_folders(db: Session, workspace_id: str) -> list:
    """Get all folders in workspace"""
    return db.query(Folder).filter(Folder.workspace_id == workspace_id).all()


def update_folder(db: Session, folder_id: str, workspace_id: str, **kwargs) -> Folder | None:
    """Update folder"""
    folder = get_folder(db, folder_id, workspace_id)
    if not folder:
        return None

    for key, value in kwargs.items():
        if value is not None and hasattr(folder, key):
            setattr(folder, key, value)

    db.commit()
    db.refresh(folder)
    return folder


def delete_folder(db: Session, folder_id: str, workspace_id: str) -> bool:
    """Delete folder"""
    folder = get_folder(db, folder_id, workspace_id)
    if not folder:
        return False

    db.delete(folder)
    db.commit()
    return True


def create_snippet(
    db: Session,
    workspace_id: str,
    name: str,
    content: str,
    description: str = None,
    folder_id: str = None,
) -> Snippet:
    """Create a new snippet"""
    snippet = Snippet(
        id=str(uuid4()),
        name=name,
        content=content,
        description=description,
        workspace_id=workspace_id,
        folder_id=folder_id,
        version=1,
    )
    db.add(snippet)
    db.commit()
    db.refresh(snippet)
    return snippet


def get_snippet(db: Session, snippet_id: str, workspace_id: str) -> Snippet | None:
    """Get snippet by ID"""
    return db.query(Snippet).filter(
        Snippet.id == snippet_id,
        Snippet.workspace_id == workspace_id
    ).first()


def get_snippets(db: Session, workspace_id: str, skip: int = 0, limit: int = 100) -> list:
    """Get all snippets in workspace"""
    return db.query(Snippet).filter(
        Snippet.workspace_id == workspace_id
    ).offset(skip).limit(limit).all()


def update_snippet(
    db: Session,
    snippet_id: str,
    workspace_id: str,
    **kwargs
) -> Snippet | None:
    """Update snippet"""
    snippet = get_snippet(db, snippet_id, workspace_id)
    if not snippet:
        return None

    for key, value in kwargs.items():
        if value is not None and hasattr(snippet, key) and key != "version":
            setattr(snippet, key, value)

    # Increment version
    snippet.version += 1

    db.commit()
    db.refresh(snippet)
    return snippet


def delete_snippet(db: Session, snippet_id: str, workspace_id: str) -> bool:
    """Delete snippet"""
    snippet = get_snippet(db, snippet_id, workspace_id)
    if not snippet:
        return False

    db.delete(snippet)
    db.commit()
    return True
