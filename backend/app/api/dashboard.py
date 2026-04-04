"""
Dashboard endpoints: statistics and recent activity
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Workspace, Prompt, Snippet, TestRun

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get dashboard statistics"""
    workspace = db.query(Workspace).filter(Workspace.user_id == user_id).first()

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Count prompts
    prompt_count = db.query(func.count(Prompt.id)).filter(
        Prompt.workspace_id == workspace.id
    ).scalar() or 0

    # Count snippets
    snippet_count = db.query(func.count(Snippet.id)).filter(
        Snippet.workspace_id == workspace.id
    ).scalar() or 0

    # Count test runs
    test_run_count = db.query(func.count(TestRun.id)).filter(
        TestRun.workspace_id == workspace.id
    ).scalar() or 0

    # Get recent test runs
    recent_tests = db.query(TestRun).filter(
        TestRun.workspace_id == workspace.id
    ).order_by(TestRun.created_at.desc()).limit(5).all()

    # Get recent prompts
    recent_prompts = db.query(Prompt).filter(
        Prompt.workspace_id == workspace.id
    ).order_by(Prompt.created_at.desc()).limit(5).all()

    return {
        "workspace_id": workspace.id,
        "workspace_name": workspace.name,
        "stats": {
            "prompts": prompt_count,
            "snippets": snippet_count,
            "test_runs": test_run_count,
        },
        "recent_prompts": [
            {
                "id": p.id,
                "name": p.name,
                "created_at": p.created_at,
            }
            for p in recent_prompts
        ],
        "recent_tests": [
            {
                "id": t.id,
                "status": t.status,
                "model": t.model,
                "created_at": t.created_at,
            }
            for t in recent_tests
        ],
    }
