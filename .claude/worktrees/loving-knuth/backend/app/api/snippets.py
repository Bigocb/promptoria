"""
Snippets endpoints: list, create, update, delete
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user
from ..schemas.snippet import (
    SnippetCreate, SnippetUpdate, SnippetResponse,
    FolderCreate, FolderUpdate, FolderResponse
)
from ..crud.snippet import (
    create_snippet, get_snippet, get_snippets, update_snippet, delete_snippet,
    create_folder, get_folder, get_folders, update_folder, delete_folder
)
from ..models import Workspace

router = APIRouter()


def get_user_workspace(user_id: str, db: Session) -> Workspace:
    """Get user's workspace"""
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


# Snippet endpoints
@router.get("", response_model=list[SnippetResponse])
async def list_snippets(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    """List all snippets"""
    workspace = get_user_workspace(user_id, db)
    snippets = get_snippets(db, workspace.id, skip, limit)
    return snippets


@router.get("/{snippet_id}", response_model=SnippetResponse)
async def get_snippet_detail(
    snippet_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get snippet by ID"""
    workspace = get_user_workspace(user_id, db)
    snippet = get_snippet(db, snippet_id, workspace.id)

    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")

    return snippet


@router.post("", response_model=SnippetResponse, status_code=201)
async def create_new_snippet(
    data: SnippetCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Create new snippet"""
    workspace = get_user_workspace(user_id, db)

    snippet = create_snippet(
        db,
        workspace.id,
        data.name,
        data.content,
        description=data.description,
        folder_id=data.folder_id,
    )

    return snippet


@router.put("/{snippet_id}", response_model=SnippetResponse)
async def update_snippet_handler(
    snippet_id: str,
    data: SnippetUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Update snippet"""
    workspace = get_user_workspace(user_id, db)

    snippet = update_snippet(
        db,
        snippet_id,
        workspace.id,
        **data.model_dump(exclude_unset=True),
    )

    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")

    return snippet


@router.delete("/{snippet_id}", status_code=204)
async def delete_snippet_handler(
    snippet_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Delete snippet"""
    workspace = get_user_workspace(user_id, db)

    success = delete_snippet(db, snippet_id, workspace.id)
    if not success:
        raise HTTPException(status_code=404, detail="Snippet not found")

    return None


# Folder endpoints
@router.get("/folders", response_model=list[FolderResponse])
async def list_folders(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """List all folders"""
    workspace = get_user_workspace(user_id, db)
    folders = get_folders(db, workspace.id)
    return folders


@router.post("/folders", response_model=FolderResponse, status_code=201)
async def create_new_folder(
    data: FolderCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Create new folder"""
    workspace = get_user_workspace(user_id, db)

    folder = create_folder(
        db,
        workspace.id,
        data.name,
        description=data.description,
    )

    return folder


@router.put("/folders/{folder_id}", response_model=FolderResponse)
async def update_folder_handler(
    folder_id: str,
    data: FolderUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Update folder"""
    workspace = get_user_workspace(user_id, db)

    folder = update_folder(
        db,
        folder_id,
        workspace.id,
        **data.model_dump(exclude_unset=True),
    )

    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    return folder


@router.delete("/folders/{folder_id}", status_code=204)
async def delete_folder_handler(
    folder_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Delete folder"""
    workspace = get_user_workspace(user_id, db)

    success = delete_folder(db, folder_id, workspace.id)
    if not success:
        raise HTTPException(status_code=404, detail="Folder not found")

    return None
