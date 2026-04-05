"""
Suggestions endpoint: get AI-powered prompt improvement suggestions
Uses Ollama for local LLM-based analysis (zero configuration needed).
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import Workspace, PromptVersion, Prompt
from ..utils.llm import compile_prompt, get_ollama_client

router = APIRouter()


class SuggestionsRequest(BaseModel):
    """Request body for suggestions endpoint"""
    prompt_version_id: str


@router.post("")
async def get_suggestions_from_body(
    data: SuggestionsRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    Get AI-powered suggestions for improving a prompt.
    Accepts prompt_version_id in request body.
    """
    return await _get_suggestions_impl(data.prompt_version_id, db, user_id)


@router.post("/{prompt_version_id}")
async def _get_suggestions_impl(
    prompt_version_id: str,
    db: Session,
    user_id: str,
):
    """
    Implementation of suggestions logic (shared by both endpoints).
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
    prompt = db.query(Prompt).filter(Prompt.id == version.prompt_id).first()
    if not prompt or prompt.workspace_id != workspace.id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # Compile prompt (without variables for suggestions)
        compiled_prompt = compile_prompt(db, prompt_version_id, {})

        # Get suggestions from Ollama
        client = get_ollama_client()
        suggestions = await client.suggest_improvements(compiled_prompt)

        return {
            "prompt_version_id": version.id,
            "suggestions": suggestions,
        }

    except Exception as e:
        # Return helpful error message
        raise HTTPException(status_code=500, detail=str(e))


async def get_suggestions(
    prompt_version_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    Get AI-powered suggestions for improving a prompt.
    Accepts prompt_version_id in URL path.
    """
    return await _get_suggestions_impl(prompt_version_id, db, user_id)
