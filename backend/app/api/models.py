"""
Models endpoint: list available Ollama models with metadata
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from ..utils.llm import get_ollama_client
from ..core.config import settings

router = APIRouter()


class ModelInfo(BaseModel):
    id: str
    name: str
    size: Optional[str] = None
    parameter_size: Optional[str] = None
    quantization_level: Optional[str] = None
    family: Optional[str] = None
    description: str


class ModelsResponse(BaseModel):
    models: List[ModelInfo]
    ollama_available: bool
    error: Optional[str] = None


def _format_size(size_bytes: int) -> str:
    """Format bytes into human-readable size string"""
    if size_bytes >= 1_000_000_000:
        return f"{size_bytes / 1_000_000_000:.1f}GB"
    elif size_bytes >= 1_000_000:
        return f"{size_bytes / 1_000_000:.0f}MB"
    return f"{size_bytes} bytes"


def _infer_family(model_id: str, details: dict) -> str:
    """
    Return a family name for grouping/filtering.
    Uses details.family if present, otherwise derives from the model name.
    E.g. 'deepseek-v3.1:671b' -> 'deepseek', 'gpt-oss:120b' -> 'gpt-oss'
    """
    family = details.get("family", "") or ""
    if family:
        return family.lower()
    # Strip tag (everything after ':'), then take the first dash-delimited segment
    base = model_id.split(":")[0]
    # Keep compound names like 'gpt-oss' intact by only splitting on digits that
    # signal a version number (e.g. 'llama3' -> 'llama', 'deepseek-v3' -> 'deepseek')
    import re
    segment = re.split(r"[\d]", base)[0].rstrip("-").rstrip(".")
    return segment.lower() if segment else base.lower()


def _build_description(model_data: dict) -> str:
    """Build a human-readable description from Ollama model metadata (no raw size)"""
    parts = []
    details = model_data.get("details", {})

    param_size = details.get("parameter_size", "")
    if param_size:
        parts.append(param_size)

    quant = details.get("quantization_level", "")
    if quant:
        parts.append(quant)

    family = details.get("family", "")
    if family:
        parts.append(family)

    return " · ".join(parts) if parts else "Local Ollama model"


@router.get("", response_model=ModelsResponse)
async def list_models():
    """
    Fetch available models from Ollama.
    Returns model list with metadata, or an error if Ollama is unavailable.
    """
    try:
        client = get_ollama_client()
        # Use the raw ollama client to get full model details
        response = client.client.list()

        raw_models = response.get("models", [])
        models = []
        for m in raw_models:
            model_id = m.get("name", "") or m.get("model", "")
            if not model_id:
                continue

            details = m.get("details", {})
            models.append(ModelInfo(
                id=model_id,
                name=model_id,
                size=_format_size(m.get("size", 0)) if m.get("size") else None,
                parameter_size=details.get("parameter_size"),
                quantization_level=details.get("quantization_level"),
                family=_infer_family(model_id, details),
                description=_build_description(m),
            ))

        return ModelsResponse(models=models, ollama_available=True)

    except Exception as e:
        error_msg = str(e)
        if "Connection" in error_msg or "refused" in error_msg.lower() or "connect" in error_msg.lower():
            return ModelsResponse(
                models=[],
                ollama_available=False,
                error=f"Ollama is not running at {settings.ollama_endpoint}. Start it with: ollama serve"
            )
        return ModelsResponse(
            models=[],
            ollama_available=False,
            error=f"Failed to fetch models: {error_msg}"
        )
