"""
Ollama LLM integration for prompt execution and suggestions.
Supports both local Ollama (http://localhost:11434) and cloud Ollama (https://ollama.com).
Uses the official ollama Python library for compatibility.
"""

import time
from typing import Optional, Dict, List, Any
from sqlalchemy.orm import Session

from ..models import PromptVersion, PromptComposition, Snippet


class OllamaClient:
    """Client for Ollama API integration (local or cloud)"""

    def __init__(self, base_url: str = "http://localhost:11434", api_key: Optional[str] = None):
        self.base_url = base_url
        self.api_key = api_key

        # Import here to avoid issues if ollama library not installed
        try:
            from ollama import Client

            # Build headers for authentication if API key provided (for cloud Ollama)
            headers = {}
            if api_key:
                headers['Authorization'] = f'Bearer {api_key}'

            self.client = Client(host=base_url, headers=headers if headers else None)
        except ImportError:
            raise RuntimeError("ollama library not installed. Run: pip install ollama")

    async def generate(self, model: str, prompt: str, **kwargs) -> str:
        """
        Generate text from Ollama.

        Args:
            model: Model name (e.g., "mistral", "llama3.2", "gpt-oss:120b")
            prompt: Input prompt text
            **kwargs: Additional options (temperature, num_predict, etc.)

        Returns:
            Generated text response

        Raises:
            Exception: If Ollama is unavailable or request fails
        """
        try:
            # Build messages for chat API (more flexible than generate)
            messages = [{"role": "user", "content": prompt}]

            # Build options from kwargs
            options = {}
            if "temperature" in kwargs:
                options["temperature"] = kwargs["temperature"]
            if "max_tokens" in kwargs:
                # Ollama uses num_predict instead of max_tokens
                options["num_predict"] = kwargs["max_tokens"]

            # Call the chat method
            response = self.client.chat(
                model=model,
                messages=messages,
                stream=False,
                options=options if options else None,
            )

            # Extract response content
            return response.get("message", {}).get("content", "")

        except Exception as e:
            error_msg = str(e)
            if "404" in error_msg:
                raise Exception(
                    f"Model '{model}' not found on Ollama. "
                    f"Available at {self.base_url}. "
                    f"Check available models at {self.base_url}/api/tags"
                )
            elif "Connection" in error_msg or "refused" in error_msg.lower():
                raise Exception(
                    f"Ollama is not available at {self.base_url}. "
                    f"For local: Start Ollama with 'ollama serve'. "
                    f"For cloud: Check OLLAMA_ENDPOINT and OLLAMA_API_KEY environment variables."
                )
            else:
                raise Exception(f"Ollama API error: {error_msg}")

    async def get_models(self) -> List[str]:
        """
        Get list of available models from Ollama.

        Returns:
            List of model names
        """
        try:
            response = self.client.list()
            models = [model.get("name", "") for model in response.get("models", [])]
            return [m for m in models if m]  # Filter empty strings
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

        Raises:
            Exception: If Ollama is unavailable or response cannot be parsed
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

        response_text = await self.generate(model, critique_prompt, num_predict=500)

        # Parse JSON response
        import json

        # Extract JSON from response (handle cases where model adds text around JSON)
        start_idx = response_text.find("[")
        end_idx = response_text.rfind("]") + 1

        if start_idx != -1 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            try:
                suggestions = json.loads(json_str)
                return suggestions
            except json.JSONDecodeError as e:
                raise Exception(f"Failed to parse suggestions JSON: {str(e)}\nResponse was: {response_text[:200]}")
        else:
            raise Exception(f"No JSON array found in response: {response_text[:200]}")

    async def close(self):
        """Close the HTTP client"""
        # ollama Client doesn't need explicit closing
        pass


# Global Ollama client instance
_ollama_client: Optional[OllamaClient] = None
_cached_endpoint: Optional[str] = None
_cached_api_key: Optional[str] = None


def get_ollama_client() -> OllamaClient:
    """Get or create the global Ollama client
    Uses settings from config.py for endpoint and API key
    Recreates client if endpoint or API key changes
    """
    global _ollama_client, _cached_endpoint, _cached_api_key
    from ..core.config import settings

    # Recreate client if settings have changed
    if (_ollama_client is None or
        _cached_endpoint != settings.ollama_endpoint or
        _cached_api_key != settings.ollama_api_key):
        _ollama_client = OllamaClient(
            base_url=settings.ollama_endpoint,
            api_key=settings.ollama_api_key
        )
        _cached_endpoint = settings.ollama_endpoint
        _cached_api_key = settings.ollama_api_key

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

    try:
        output = await client.generate(
            model,
            prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )
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
