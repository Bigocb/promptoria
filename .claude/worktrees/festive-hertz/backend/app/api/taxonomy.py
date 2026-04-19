"""
Taxonomy endpoints: manage prompt categories and interaction types
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from uuid import uuid4
from typing import Optional

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import Workspace, AgentInteractionType, PromptCategory, Prompt

router = APIRouter()


class CategoryCreate(BaseModel):
    """Request model for creating a category"""
    name: str
    description: Optional[str] = None
    agent_interaction_type_id: str


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

    # Fetch all prompts for workspace at once (avoid N+1)
    all_prompts = db.query(Prompt).filter(Prompt.workspace_id == workspace.id).all()
    prompts_by_category = {}
    for p in all_prompts:
        if p.category_id:
            if p.category_id not in prompts_by_category:
                prompts_by_category[p.category_id] = []
            prompts_by_category[p.category_id].append(p)

    result = []
    for t in types:
        categories = []
        for c in t.categories:
            prompts = prompts_by_category.get(c.id, [])
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
    """Create interaction type with default category"""
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

    # Create default category for this interaction type
    default_category = PromptCategory(
        id=str(uuid4()),
        name="General",
        description="Default category",
        workspace_id=workspace.id,
        agent_interaction_type_id=interaction_type.id,
    )
    db.add(default_category)
    db.commit()

    return {
        "id": interaction_type.id,
        "name": interaction_type.name,
        "description": interaction_type.description,
        "emoji": interaction_type.emoji,
    }


# Categories endpoints
@router.get("/categories")
async def list_categories(
    typeId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """List categories, optionally filtered by interaction type (auto-creates default if none exist)"""
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Build query - filter by workspace and optionally by typeId
    query = db.query(PromptCategory).filter(PromptCategory.workspace_id == workspace.id)
    if typeId:
        query = query.filter(PromptCategory.agent_interaction_type_id == typeId)

    categories = query.all()

    # Auto-create default category for a specific type if it has none
    if typeId and not categories:
        # Ensure the type exists and belongs to user
        interaction_type = db.query(AgentInteractionType).filter(
            AgentInteractionType.id == typeId,
            AgentInteractionType.workspace_id == workspace.id
        ).first()

        if interaction_type:
            # Check if General category already exists
            existing = db.query(PromptCategory).filter(
                PromptCategory.agent_interaction_type_id == typeId,
                PromptCategory.name == "General"
            ).first()

            if not existing:
                default_category = PromptCategory(
                    id=str(uuid4()),
                    name="General",
                    description="Default category",
                    workspace_id=workspace.id,
                    agent_interaction_type_id=typeId,
                )
                db.add(default_category)
                db.commit()
                categories = [default_category]
            else:
                categories = [existing]

    # Auto-create default category if none exist globally (only when not filtering by typeId)
    elif not categories and not typeId:
        # Create default interaction type
        default_type = db.query(AgentInteractionType).filter(
            AgentInteractionType.workspace_id == workspace.id,
            AgentInteractionType.name == "My Prompts"
        ).first()

        if not default_type:
            default_type = AgentInteractionType(
                id=str(uuid4()),
                name="My Prompts",
                description="Your personal prompts",
                emoji="📝",
                workspace_id=workspace.id,
            )
            db.add(default_type)
            db.commit()
            db.refresh(default_type)

        # Create default category
        default_category = PromptCategory(
            id=str(uuid4()),
            name="General",
            description="Uncategorized prompts",
            workspace_id=workspace.id,
            agent_interaction_type_id=default_type.id,
        )
        db.add(default_category)
        db.commit()
        db.refresh(default_category)

        categories = [default_category]

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
    data: CategoryCreate = Body(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Create category"""
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Validate that interaction type exists and belongs to user
    interaction_type = db.query(AgentInteractionType).filter(
        AgentInteractionType.id == data.agent_interaction_type_id,
        AgentInteractionType.workspace_id == workspace.id
    ).first()

    if not interaction_type:
        raise HTTPException(status_code=400, detail="Interaction type not found or does not belong to your workspace")

    try:
        category = PromptCategory(
            id=str(uuid4()),
            name=data.name,
            description=data.description,
            workspace_id=workspace.id,
            agent_interaction_type_id=data.agent_interaction_type_id,
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
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create category: {str(e)}")
