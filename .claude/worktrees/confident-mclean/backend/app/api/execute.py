"""
Execute endpoints: run prompts and manage test results
Uses Ollama for local LLM execution (zero configuration needed).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from pydantic import BaseModel
from typing import Optional, Dict

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import Workspace, PromptVersion, TestRun, Prompt, UserSettings
from ..utils.llm import compile_prompt, execute_with_ollama

router = APIRouter()


class ExecuteRequest(BaseModel):
    """Execute prompt request"""
    prompt_version_id: str
    variables: Optional[Dict[str, str]] = None
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 500


@router.post("", status_code=201)
async def execute_prompt(
    data: ExecuteRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    Execute a prompt using Ollama (no configuration needed - just works!).
    Stores result as test run with output, tokens, and latency.
    """
    if not data.prompt_version_id:
        raise HTTPException(status_code=400, detail="prompt_version_id required")

    variables = data.variables or {}

    # Get user's workspace
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Get prompt version
    version = db.query(PromptVersion).filter(
        PromptVersion.id == data.prompt_version_id
    ).first()

    if not version:
        raise HTTPException(status_code=404, detail="Prompt version not found")

    # Verify access: version belongs to user's workspace
    prompt = db.query(Prompt).filter(Prompt.id == version.prompt_id).first()
    if not prompt or prompt.workspace_id != workspace.id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # Use model from request if provided, otherwise use user's default
        if data.model:
            model = data.model
        else:
            user_settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
            model = user_settings.default_model if user_settings else "mistral"

        # Compile prompt with snippets and variable substitution
        compiled_prompt = compile_prompt(db, data.prompt_version_id, variables)

        # Execute via Ollama with user's selected model and parameters
        result = await execute_with_ollama(
            compiled_prompt,
            model=model,
            temperature=data.temperature,
            max_tokens=data.max_tokens
        )

        # Create and store test run with results
        test_run = TestRun(
            id=str(uuid4()),
            prompt_version_id=version.id,
            prompt_id=version.prompt_id,
            workspace_id=workspace.id,
            compiled_prompt=compiled_prompt,
            variables=variables,
            output=result["output"],
            input_tokens=result["input_tokens"],
            output_tokens=result["output_tokens"],
            total_tokens=result["total_tokens"],
            latency_ms=result["latency_ms"],
            cost_usd=result["cost_usd"],
            model=model,  # Store the model that was used
            status="success",
        )
        db.add(test_run)
        db.commit()
        db.refresh(test_run)

        return {
            "id": test_run.id,
            "prompt_version_id": test_run.prompt_version_id,
            "status": test_run.status,
            "model": test_run.model,
            "output": test_run.output,
            "input_tokens": test_run.input_tokens,
            "output_tokens": test_run.output_tokens,
            "total_tokens": test_run.total_tokens,
            "latency_ms": test_run.latency_ms,
            "cost_usd": test_run.cost_usd,
            "created_at": test_run.created_at,
        }

    except Exception as e:
        # Store error state in test run
        test_run = TestRun(
            id=str(uuid4()),
            prompt_version_id=version.id,
            prompt_id=version.prompt_id,
            workspace_id=workspace.id,
            compiled_prompt="",
            variables=variables,
            status="error",
            error_message=str(e),
        )
        db.add(test_run)
        db.commit()

        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{prompt_version_id}")
async def get_test_history(
    prompt_version_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
):
    """Get test run history for a prompt version"""
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    tests = db.query(TestRun).filter(
        TestRun.prompt_version_id == prompt_version_id,
        TestRun.workspace_id == workspace.id,
    ).order_by(TestRun.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": t.id,
            "status": t.status,
            "model": t.model,
            "output": t.output,
            "input_tokens": t.input_tokens,
            "output_tokens": t.output_tokens,
            "total_tokens": t.total_tokens,
            "cost_usd": t.cost_usd,
            "latency_ms": t.latency_ms,
            "error_message": t.error_message,
            "created_at": t.created_at,
        }
        for t in tests
    ]
