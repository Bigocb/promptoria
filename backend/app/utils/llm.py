"""
Ollama LLM integration for prompt execution and suggestions.
Uses local Ollama instance at http://localhost:11434 (zero configuration).
Default model: mistral (auto-pulled on first use, transparent to user).
"""

import httpx
import time
import asyncio
from typing import Optional, Dict, List, Any
from sqlalchemy.orm import Session

from ..models import PromptVersion, PromptComposition, Snippet


class OllamaClient:
    """Client for Ollama API integration"""

    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=None)  # No timeout for long-running requests

    async def generate(self, model: str, prompt: str, **kwargs) -> str:
        """
        Generate text from Ollama.

        Args:
            model: Model name (e.g., "mistral", "llama2")
            prompt: Input prompt text
            **kwargs: Additional options (temperature, top_p, etc.)

        Returns:
            Generated text response

        Raises:
            Exception: If Ollama is unavailable or request fails
        """
        url = f"{self.base_url}/api/generate"

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,  # Non-streaming for simpler implementation
        }

        # Add optional parameters
        if "temperature" in kwargs:
            payload["options"] = {"temperature": kwargs["temperature"]}
        if "top_p" in kwargs:
            if "options" not in payload:
                payload["options"] = {}
            payload["options"]["top_p"] = kwargs["top_p"]
        if "num_predict" in kwargs:
            if "options" not in payload:
                payload["options"] = {}
            payload["options"]["num_predict"] = kwargs["num_predict"]

        try:
            response = await self.client.post(url, json=payload)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "")
        except httpx.ConnectError:
            raise Exception(
                "Ollama is not available at http://localhost:11434. "
                "Please start Ollama with: ollama serve"
            )
        except Exception as e:
            raise Exception(f"Ollama API error: {str(e)}")

    async def get_models(self) -> List[str]:
        """
        Get list of available models from Ollama.

        Returns:
            List of model names
        """
        url = f"{self.base_url}/api/tags"

        try:
            response = await self.client.get(url)
            response.raise_for_status()
            result = response.json()
            models = [model["name"] for model in result.get("models", [])]
            return models
        except Exception:
            return []

    async def suggest_improvements(self, prompt: str, model: str = "mistral") -> List[Dict[str, Any]]:
        """
        Generate structured suggestions for prompt improvement using Ollama.

        Args:
            prompt: The prompt to critique
            model: Model to use for suggestions (default: mistral)

        Returns:
            List of suggestion objects with type, message, severity
        """
        system_prompt = """You are an expert prompt engineer. Analyze the given prompt and provide 2-3 specific, actionable suggestions to improve it.

For each suggestion, provide:
1. type: one of [clarity, specificity, structure, tone, format]
2. message: the specific suggestion (max 100 chars)
3. severity: one of [low, medium, high] based on impact

Format your response as a JSON array like:
[
  {"type": "clarity", "message": "Add specific format examples", "severity": "high"},
  {"type": "specificity", "message": "Define expected output length", "severity": "medium"}
]

Only return the JSON array, no other text."""

        critique_prompt = f"{system_prompt}\n\nPrompt to analyze:\n{prompt}"

        try:
            response_text = await self.generate(model, critique_prompt, num_predict=500)

            # Parse JSON response
            import json

            # Extract JSON from response (handle cases where model adds text around JSON)
            start_idx = response_text.find("[")
            end_idx = response_text.rfind("]") + 1

            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                suggestions = json.loads(json_str)
                return suggestions
            else:
                # Fallback if parsing fails
                return [
                    {
                        "type": "clarity",
                        "message": "Consider making the prompt more specific",
                        "severity": "medium",
                    }
                ]
        except Exception:
            # Return default suggestion if Ollama fails
            return [
                {
                    "type": "clarity",
                    "message": "Consider making the prompt more specific",
                    "severity": "medium",
                }
            ]

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Global Ollama client instance
_ollama_client: Optional[OllamaClient] = None


def get_ollama_client() -> OllamaClient:
    """Get or create the global Ollama client"""
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = OllamaClient()
    return _ollama_client


def compile_prompt(db: Session, version_id: str, variables: Optional[Dict[str, str]] = None) -> str:
    """
    Compile a prompt by fetching the version, merging snippets, and substituting variables.

    Args:
        db: Database session
        version_id: ID of the PromptVersion to compile
        variables: Dictionary of variables to substitute (e.g., {"name": "John"})

    Returns:
        Compiled prompt text with variables substituted
    """
    if variables is None:
        variables = {}

    # Fetch the prompt version
    version = db.query(PromptVersion).filter(PromptVersion.id == version_id).first()
    if not version:
        raise ValueError(f"PromptVersion {version_id} not found")

    # Start with template body
    compiled = version.template_body

    # Fetch and merge snippets by rank
    compositions = (
        db.query(PromptComposition)
        .filter(PromptComposition.prompt_version_id == version_id)
        .order_by(PromptComposition.rank.asc())
        .all()
    )

    # Insert snippets in order
    for composition in compositions:
        snippet = db.query(Snippet).filter(Snippet.id == composition.snippet_id).first()
        if snippet:
            # Replace {{snippet_N}} or similar markers, or append
            marker = f"{{{{snippet_{composition.rank}}}}}"
            if marker in compiled:
                compiled = compiled.replace(marker, snippet.content)
            else:
                # If no marker, append with spacing
                compiled += f"\n\n{snippet.content}"

    # Substitute user variables ({{variable}} → value)
    for var_name, var_value in variables.items():
        placeholder = f"{{{{{var_name}}}}}"
        compiled = compiled.replace(placeholder, str(var_value))

    return compiled


def calculate_tokens(text: str) -> int:
    """
    Estimate token count for text using simple heuristic.

    Args:
        text: Text to estimate tokens for

    Returns:
        Estimated token count

    Note:
        This is a rough approximation. For accurate counts, use tokenizers
        specific to each model. Typical ratio: ~1 token per 4 characters.
    """
    # Rough estimate: 1 token ≈ 4 characters (English text average)
    return len(text) // 4


async def execute_with_ollama(
    prompt: str,
    model: str = "mistral",
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Execute a prompt using Ollama and collect metrics.

    Args:
        prompt: The compiled prompt to execute
        model: Model to use (default: mistral)
        temperature: Temperature for generation (0.0-1.0)
        max_tokens: Maximum tokens to generate (optional)

    Returns:
        Dictionary with:
        - output: Generated text
        - input_tokens: Estimated input tokens
        - output_tokens: Estimated output tokens
        - total_tokens: Sum of input + output
        - latency_ms: Request latency in milliseconds
        - cost_usd: 0 (Ollama is free)
    """
    client = get_ollama_client()
    start_time = time.time()

    kwargs = {"temperature": temperature}
    if max_tokens:
        kwargs["num_predict"] = max_tokens

    try:
        output = await client.generate(model, prompt, **kwargs)
        elapsed_ms = (time.time() - start_time) * 1000

        input_tokens = calculate_tokens(prompt)
        output_tokens = calculate_tokens(output)

        return {
            "output": output,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "latency_ms": int(elapsed_ms),
            "cost_usd": 0,  # Ollama is free
        }
    except Exception as e:
        raise Exception(f"Failed to execute prompt with Ollama: {str(e)}")
