"""
Prompts endpoints: list, create, update, delete, get versions
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user
from ..schemas.prompt import (
    PromptCreate, PromptUpdate, PromptResponse, PromptDetailResponse,
    PromptVersionCreate, PromptVersionResponse
)
from ..crud.prompt import (
    create_prompt, get_prompt, get_prompts, update_prompt, delete_prompt,
    create_version, get_prompt_versions
)
from ..models import Workspace

router = APIRouter()


def get_user_workspace(user_id: str, db: Session) -> Workspace:
    """Get user's workspace"""
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.get("", response_model=list[PromptResponse])
async def list_prompts(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    """List all prompts in user's workspace"""
    workspace = get_user_workspace(user_id, db)
    prompts = get_prompts(db, workspace.id, skip, limit)
    return prompts


@router.get("/{prompt_id}", response_model=PromptDetailResponse)
async def get_prompt_detail(
    prompt_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get prompt with all versions"""
    workspace = get_user_workspace(user_id, db)
    prompt = get_prompt(db, prompt_id, workspace.id)

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Get all versions
    versions = get_prompt_versions(db, prompt_id)

    return {
        **{c.name: getattr(prompt, c.name) for c in prompt.__table__.columns},
        "versions": versions,
    }


@router.post("", response_model=PromptResponse, status_code=201)
async def create_new_prompt(
    data: PromptCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Create new prompt"""
    workspace = get_user_workspace(user_id, db)

    prompt = create_prompt(
        db,
        workspace.id,
        data.name,
        data.template_body,
        description=data.description,
        folder_id=data.folder_id,
        category_id=data.category_id,
        tags=data.tags,
        model=data.model,
    )

    return prompt


@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt_metadata(
    prompt_id: str,
    data: PromptUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Update prompt metadata"""
    workspace = get_user_workspace(user_id, db)

    prompt = update_prompt(
        db,
        prompt_id,
        workspace.id,
        **data.model_dump(exclude_unset=True),
    )

    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    return prompt


@router.delete("/{prompt_id}", status_code=204)
async def delete_prompt_handler(
    prompt_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Delete prompt"""
    workspace = get_user_workspace(user_id, db)

    success = delete_prompt(db, prompt_id, workspace.id)
    if not success:
        raise HTTPException(status_code=404, detail="Prompt not found")

    return None


@router.post("/{prompt_id}/versions", response_model=PromptVersionResponse, status_code=201)
async def create_new_version(
    prompt_id: str,
    data: PromptVersionCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Create new version of prompt"""
    workspace = get_user_workspace(user_id, db)

    # Check that prompt exists in user's workspace
    prompt = get_prompt(db, prompt_id, workspace.id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    version = create_version(
        db,
        prompt_id,
        data.template_body,
        model_config=data.config,
    )

    return version


@router.get("/{prompt_id}/versions", response_model=list[PromptVersionResponse])
async def get_versions(
    prompt_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get all versions of a prompt"""
    workspace = get_user_workspace(user_id, db)

    # Check that prompt exists
    prompt = get_prompt(db, prompt_id, workspace.id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    versions = get_prompt_versions(db, prompt_id)
    return versions
