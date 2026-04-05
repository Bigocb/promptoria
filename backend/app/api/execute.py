"""
Execute endpoints: run prompts and manage test results
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4

from ..core.database import get_db
from ..core.security import get_current_user
from ..models import Workspace, PromptVersion, TestRun

router = APIRouter()


class ExecuteRequest:
    """Execute prompt request"""
    def __init__(self, prompt_version_id: str, variables: dict = None):
        self.prompt_version_id = prompt_version_id
        self.variables = variables or {}


class ExecuteResponse:
    """Execute prompt response"""
    pass


@router.post("", status_code=201)
async def execute_prompt(
    data: dict,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    Execute a prompt against Claude API.
    Stores result as test run.
    """
    prompt_version_id = data.get("prompt_version_id")
    variables = data.get("variables", {})

    if not prompt_version_id:
        raise HTTPException(status_code=400, detail="prompt_version_id required")

    # Get prompt version
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

    # TODO: Compile prompt with variables
    compiled_prompt = version.template_body

    # TODO: Call Claude API
    # For now, return pending test run
    test_run = TestRun(
        id=str(uuid4()),
        prompt_version_id=version.id,
        prompt_id=version.prompt_id,
        workspace_id=workspace.id,
        variables=variables,
        compiled_prompt=compiled_prompt,
        status="pending",
    )
    db.add(test_run)
    db.commit()
    db.refresh(test_run)

    return {
        "id": test_run.id,
        "prompt_version_id": test_run.prompt_version_id,
        "status": test_run.status,
        "created_at": test_run.created_at,
    }


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
