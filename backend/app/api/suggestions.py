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
from ..models import Workspace, PromptVersion, Prompt, UserSettings
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
    Uses user's default_model from settings.
    """
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if not prompt_text.strip():
        raise HTTPException(status_code=400, detail="Prompt text is required")

    try:
        # Get user's default model from settings
        user_settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        model = user_settings.default_model if user_settings else "mistral"

        # Get suggestions from Ollama using user's selected model
        client = get_ollama_client()
        suggestion_list = await client.suggest_improvements(prompt_text, model=model)

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
        # Return helpful error message with debugging info
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in suggestions: {error_trace}")
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


class TagSuggestionsRequest(BaseModel):
    """Request for tag suggestions"""
    prompt_content: str = Field(..., alias="promptContent")

    class Config:
        populate_by_name = True


class TagSuggestionsResponse(BaseModel):
    """Response with suggested tags"""
    tags: list[str]


@router.post("/tags", response_model=TagSuggestionsResponse)
async def get_tag_suggestions(
    data: TagSuggestionsRequest = Body(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    Get AI-powered tag suggestions based on prompt content.
    Uses Ollama to analyze the prompt and suggest relevant tags.
    Uses user's default_model from settings.
    """
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if not data.prompt_content.strip():
        raise HTTPException(status_code=400, detail="Prompt content is required")

    try:
        # Get user's default model from settings
        user_settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        model = user_settings.default_model if user_settings else "mistral"

        client = get_ollama_client()

        system_prompt = """You are an expert at tagging and categorizing prompts. Analyze the given prompt and suggest 5-8 relevant tags that describe its purpose, technique, and characteristics.

Tags should be:
- Lowercase, hyphenated (e.g., "instruction-following", "chain-of-thought")
- Specific and meaningful
- Related to the prompt's purpose, domain, or technique

Return ONLY a JSON array of strings, like:
["tag1", "tag2", "tag3", "tag4", "tag5"]

No other text."""

        tag_prompt = f"{system_prompt}\n\nPrompt to tag:\n{data.prompt_content}"

        response_text = await client.generate(model, tag_prompt, num_predict=100)

        # Parse JSON response
        import json
        start_idx = response_text.find("[")
        end_idx = response_text.rfind("]") + 1

        if start_idx != -1 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            tags = json.loads(json_str)
            # Ensure we return a list of strings
            return {"tags": [str(t).lower().replace(" ", "-") for t in tags if isinstance(t, str)]}
        else:
            raise ValueError("Could not parse tags from response")

    except Exception as e:
        # Log the error but don't expose internal details
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate tag suggestions: {str(e)}")
