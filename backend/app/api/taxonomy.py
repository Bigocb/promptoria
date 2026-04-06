"""
Taxonomy endpoints: manage prompt categories and interaction types
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import Workspace, AgentInteractionType, PromptCategory, Prompt

router = APIRouter()


# Interaction types endpoints
@router.get("/interaction-types")
async def list_interaction_types(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """List all interaction types with their categories and prompts"""
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    types = db.query(AgentInteractionType).filter(
        AgentInteractionType.workspace_id == workspace.id
    ).all()

    result = []
    for t in types:
        categories = []
        for c in t.categories:
            # Fetch prompts for this category
            prompts = db.query(Prompt).filter(
                Prompt.workspace_id == workspace.id,
                Prompt.category_id == c.id
            ).all()

            categories.append({
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "prompts": [
                    {
                        "id": p.id,
                        "name": p.name,
                        "description": p.description
                    }
                    for p in prompts
                ]
            })

        result.append({
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "emoji": t.emoji,
            "categories": categories
        })

    return result


@router.post("/interaction-types", status_code=201)
async def create_interaction_type(
    data: dict,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Create interaction type"""
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    interaction_type = AgentInteractionType(
        id=str(uuid4()),
        name=data.get("name"),
        description=data.get("description"),
        emoji=data.get("emoji"),
        workspace_id=workspace.id,
    )
    db.add(interaction_type)
    db.commit()
    db.refresh(interaction_type)

    return {
        "id": interaction_type.id,
        "name": interaction_type.name,
        "description": interaction_type.description,
        "emoji": interaction_type.emoji,
    }


# Categories endpoints
@router.get("/categories")
async def list_categories(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """List all categories"""
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    categories = db.query(PromptCategory).filter(
        PromptCategory.workspace_id == workspace.id
    ).all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "agent_interaction_type_id": c.agent_interaction_type_id,
        }
        for c in categories
    ]


@router.post("/categories", status_code=201)
async def create_category(
    data: dict,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Create category"""
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    category = PromptCategory(
        id=str(uuid4()),
        name=data.get("name"),
        description=data.get("description"),
        workspace_id=workspace.id,
        agent_interaction_type_id=data.get("agent_interaction_type_id"),
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "agent_interaction_type_id": category.agent_interaction_type_id,
    }
