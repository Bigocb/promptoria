"""
Suggestions endpoint: get AI-powered prompt improvement suggestions
Uses Ollama for local LLM-based analysis (zero configuration needed).
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import Workspace, PromptVersion, Prompt
from ..utils.llm import get_ollama_client

router = APIRouter()


class SuggestionsRequest(BaseModel):
    """Request body for suggestions endpoint"""
    prompt_version_id: Optional[str] = None
    prompt: Optional[str] = Field(None, alias="promptContent")  # Accept promptContent from frontend
    focus_areas: Optional[str] = Field(None, alias="focusAreas")  # Accept focusAreas from frontend

    class Config:
        populate_by_name = True  # Allow both field name and alias


class SuggestionsResponse(BaseModel):
    """Response for suggestions endpoint"""
    suggestions: str


async def _get_suggestions_impl(
    prompt_text: str,
    focus_areas: Optional[str],
    db: Session,
    user_id: str,
):
    """
    Implementation of suggestions logic.
    Gets AI suggestions for a prompt using Ollama.
    """
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if not prompt_text.strip():
        raise HTTPException(status_code=400, detail="Prompt text is required")

    try:
        # Get suggestions from Ollama
        client = get_ollama_client()
        suggestion_list = await client.suggest_improvements(prompt_text)

        # Format suggestions as readable text
        if suggestion_list:
            formatted = "\n\n".join([
                f"• {s.get('message', 'No message')} ({s.get('type', 'general')} - {s.get('severity', 'medium')} severity)"
                for s in suggestion_list
            ])
        else:
            formatted = "No specific suggestions available at this time."

        return {"suggestions": formatted}

    except Exception as e:
        # Return helpful error message
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")


@router.post("", response_model=SuggestionsResponse)
async def get_suggestions(
    data: SuggestionsRequest = Body(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    Get AI-powered suggestions for improving a prompt.
    Accepts either:
    - Direct prompt text: {prompt: "...", focus_areas: "..."}
    - Saved prompt version: {prompt_version_id: "..."}
    """
    prompt_text = None

    # If prompt_version_id is provided, fetch and compile the prompt
    if data.prompt_version_id:
        version = db.query(PromptVersion).filter(
            PromptVersion.id == data.prompt_version_id
        ).first()

        if not version:
            raise HTTPException(status_code=404, detail="Prompt version not found")

        # Check that version belongs to user's workspace
        workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")

        prompt = db.query(Prompt).filter(Prompt.id == version.prompt_id).first()
        if not prompt or prompt.workspace_id != workspace.id:
            raise HTTPException(status_code=403, detail="Access denied")

        prompt_text = version.template_body

    # Otherwise use the prompt text directly
    elif data.prompt:
        prompt_text = data.prompt

    else:
        raise HTTPException(status_code=400, detail="Either 'prompt' or 'prompt_version_id' is required")

    return await _get_suggestions_impl(prompt_text, data.focus_areas, db, user_id)
