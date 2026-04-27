# LiteLLM Proxy Integration — Promptoria Scaling Plan

## Purpose
Replace direct Ollama/Anthropic API calls with a LiteLLM proxy gateway.
This gives us: per-user spend tracking, multi-provider routing, cost caps, rate limiting, and load balancing — without changing our app's request logic.

## Architecture
```
User → Promptoria API → LiteLLM Proxy → Ollama Cloud / Anthropic / Together.ai / etc.
                            ↑
                     Virtual keys per user
                     Spend tracking per user
                     Model access control
                     Rate limiting (builtin)
                     Fallback routing
```

## Quick Start

### 1. Install & Run
```bash
pip install 'litellm[proxy]'
litellm --config litellm_config.yaml
```

### 2. Config Template (litellm_config.yaml)
```yaml
model_list:
  # Ollama Cloud — primary for non-BYOK
  - model_name: qwen3.5-2b
    litellm_params:
      model: ollama/qwen3.5:2b
      api_base: ${OLLAMA_BASE_URL}
      api_key: ${OLLAMA_API_KEY}

  - model_name: gemma3-4b
    litellm_params:
      model: ollama/gemma3:4b
      api_base: ${OLLAMA_BASE_URL}
      api_key: ${OLLAMA_API_KEY}

  # Anthropic — BYOK passthrough
  - model_name: claude-sonnet-4
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514

  # Fallback — Together.ai for burst capacity
  - model_name: qwencoder-plus
    litellm_params:
      model: together_ai/Qwen/Qwen2.5-Coder-32B-Instruct
      api_key: ${TOGETHER_API_KEY}

general_settings:
  master_key: ${LITELLM_MASTER_KEY}
  database_url: ${DATABASE_URL}

litellm_settings:
  drop_params: true
  set_verbose: false

# Per-user budgets & rate limits
user_budgets:
  default:
    max_budget: 5.00        # $5/day default
    tpm_limit: 10000        # tokens per minute
    rpm_limit: 30           # requests per minute
  pro:
    max_budget: 25.00
    tpm_limit: 50000
    rpm_limit: 100
  enterprise:
    max_budget: 100.00
    tpm_limit: 200000
    rpm_limit: 500
```

### 3. Migration Path (from current code)

**Phase A: Sidecar** (no app changes)
- Deploy LiteLLM proxy alongside Promptoria
- Set `OLLAMA_BASE_URL=http://localhost:4000` (proxy routes to real Ollama)
- Proxy logs all requests/spend — gives us visibility without code changes

**Phase B: Virtual Keys** (replace our rate limiter)
- Create a virtual key per user on LiteLLM via `POST /key/generate`
- Store `litellm_virtual_key` in UserSettings
- Route requests through proxy with user's virtual key
- Remove our in-memory rate limiter — LiteLLM handles it

**Phase C: Multi-Provider** (add provider diversity)
- Add Together.ai, Fireworks.ai, Groq to config
- LiteLLM routes to cheapest/fastest available provider
- Remove our model-fallback.ts — LiteLLM does load balancing
- BYOK users pass their own key; proxy just routes

### 4. Key Benefits for Promptoria
| Feature | Our Code | LiteLLM Proxy |
|---|---|---|
| Per-user spend tracking | cost_cents on TestRun (post-hoc) | Real-time spend per virtual key |
| Rate limiting | In-memory, single-instance | Redis-backed, distributed |
| Multi-provider | Manual API calls per provider | Single OpenAI-compatible endpoint |
| Model fallback | resolveAvailableModel() | Config-based fallback chains |
| Cost caps | Daily token quota (indirect) | Dollar budget per user |
| GPU-minute cost | OLLAMA_GPU_RATE estimate | Actual provider billing |

### 5. Deployment
- **Docker**: `docker run -p 4000:4000 -v ./litellm_config.yaml:/app/config.yaml ghcr.io/berriai/litellm:main-latest --config /app/config.yaml`
- **Render**: Add as a separate web service in render.yaml
- **DB**: Uses same PostgreSQL — stores keys, spend, budgets

### 6. Environment Variables to Add
```
LITELLM_MASTER_KEY=sk-xxx      # admin key for proxy management
LITELLM_PROXY_URL=http://localhost:4000
TOGETHER_API_KEY=xxx           # optional second provider
OLLAMA_GPU_RATE_PER_SECOND=0.001  # current fallback rate
```