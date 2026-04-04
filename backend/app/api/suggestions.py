"""
Suggestions endpoint: get AI-powered prompt improvement suggestions
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Workspace, PromptVersion

router = APIRouter()


@router.post("/{prompt_version_id}")
async def get_suggestions(
    prompt_version_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    Get AI-powered suggestions for improving a prompt.
    Uses Claude API to analyze and suggest improvements.
    """
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    version = db.query(PromptVersion).filter(
        PromptVersion.id == prompt_version_id
    ).first()

    if not version:
        raise HTTPException(status_code=404, detail="Prompt version not found")

    # Check that version belongs to user's workspace
    from app.models import Prompt
    prompt = db.query(Prompt).filter(Prompt.id == version.prompt_id).first()
    if not prompt or prompt.workspace_id != workspace.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # TODO: Call Claude API to get suggestions
    # For now, return placeholder suggestions
    suggestions = [
        {
            "type": "clarity",
            "message": "Consider being more specific about the expected output format",
            "severity": "low",
        },
        {
            "type": "structure",
            "message": "Add more context about the task at the beginning",
            "severity": "medium",
        },
    ]

    return {
        "prompt_version_id": version.id,
        "suggestions": suggestions,
    }
