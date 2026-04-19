# PromptArchitect - AI Provider Management System 🤖

## Answer to Your Question

> **"Is it designed to use Claude specifically or is it possible to change AI client used?"**

**No, it's NOT limited to Claude!** The system supports **5+ AI providers** and is fully configurable through a **Settings section**. You can:

✅ Switch between providers (OpenAI, Claude, Cohere, Azure, Ollama)
✅ Configure multiple instances of the same provider
✅ Set defaults and overrides
✅ Test connections before using
✅ Track usage and costs per provider

---

## Supported AI Providers

### 🔴 OpenAI
- **Models**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Requires**: API Key from platform.openai.com
- **Best for**: Highest capability, good balance of speed/cost
- **Pricing**: $0.03-$0.06 per million tokens

### 🤖 Anthropic (Claude)
- **Models**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Requires**: API Key from console.anthropic.com
- **Best for**: Long context, strong reasoning
- **Pricing**: $0.0025-$0.75 per million tokens

### 🌊 Cohere
- **Models**: Command, Command Light
- **Requires**: API Key from cohere.com
- **Best for**: Cost-effective, good for embeddings
- **Pricing**: $0.0003-$0.001 per million tokens

### ☁️ Azure OpenAI
- **Models**: GPT-4, GPT-3.5 Turbo
- **Requires**: Azure endpoint and API key
- **Best for**: Enterprise, VPC isolation
- **Pricing**: Variable based on Azure pricing

### 🦙 Ollama (Local)
- **Models**: Llama 2, Mistral, Neural Chat
- **Requires**: Ollama installed locally (http://localhost:11434)
- **Best for**: Privacy, no API costs, offline use
- **Pricing**: FREE

---

## Settings Interface

### Location
`http://localhost:3000/settings`

### Features

#### 1. Add Provider Configuration
```
Provider Selector
├─ OpenAI
├─ Anthropic (Claude)
├─ Cohere
├─ Azure OpenAI
└─ Ollama (Local)

Configuration Details
├─ Name (e.g., "Production OpenAI")
├─ Description
├─ API Key (encrypted)
├─ Default Model
├─ Temperature (0-2)
├─ Max Tokens (100-4000)
└─ Top P (0-1)
```

#### 2. Manage Configurations
- ✅ View all configured providers
- ✅ Set as default
- ✅ Test connection before using
- ✅ View usage stats and costs
- ✅ Enable/disable without deleting
- ✅ Delete when no longer needed

#### 3. Usage Tracking
Per provider configuration:
- Total tokens used
- Total cost spent
- Request count
- Error count
- Last test date

---

## Database Schema

### AIProviderSettings Table

```sql
CREATE TABLE AIProviderSettings (
  id                    STRING    PRIMARY KEY
  workspace_id          STRING    REQUIRED
  provider              STRING    -- openai | anthropic | cohere | azure | ollama
  name                  STRING    REQUIRED    -- "Production OpenAI"
  description           STRING
  
  api_key_encrypted     STRING    -- Never stored plaintext
  base_url              STRING    -- For custom endpoints
  
  default_model         STRING    -- "gpt-4", "claude-3-opus", etc.
  default_temperature   FLOAT     DEFAULT 0.7
  default_max_tokens    INT       DEFAULT 2000
  default_top_p         FLOAT     DEFAULT 0.9
  
  is_default            BOOLEAN   -- Use for prompts without override
  is_enabled            BOOLEAN   -- Can be disabled without deleting
  is_public             BOOLEAN   -- Team can use?
  
  total_tokens_used     INT       -- Running total
  total_cost            FLOAT     -- Running total
  request_count         INT       -- How many times used
  error_count           INT       -- Failed requests
  
  created_at            TIMESTAMP
  updated_at            TIMESTAMP
  tested_at             TIMESTAMP -- Last successful connection test
)

CREATE TABLE PromptModelOverride (
  id                    STRING    PRIMARY KEY
  prompt_version_id     STRING    -- Which prompt
  ai_provider_id        STRING    -- Which provider to use
  created_at            TIMESTAMP
)
```

---

## API Endpoints

### Create Provider Config

```bash
POST /api/settings/providers

{
  "provider": "openai",
  "name": "Production OpenAI",
  "description": "Main production account",
  "api_key": "sk-...",
  "default_model": "gpt-4",
  "default_temperature": 0.7,
  "default_max_tokens": 2000,
  "default_top_p": 0.9,
  "is_public": false
}
```

### Get All Configs

```bash
GET /api/settings/providers?workspace_id=ws_123
```

### Get Default Provider

```bash
GET /api/settings/providers/default?workspace_id=ws_123
```

### Set Default Provider

```bash
PUT /api/settings/providers/default

{
  "provider_id": "config_123"
}
```

### Test Connection

```bash
POST /api/settings/providers/test

{
  "provider_id": "config_123"
}
```

### Update Configuration

```bash
PUT /api/settings/providers/config_123

{
  "default_temperature": 0.9,
  "default_max_tokens": 4000
}
```

### Delete Configuration

```bash
DELETE /api/settings/providers/config_123
```

---

## How It Works in Prompts

### Option 1: Use Default Provider
```typescript
// In Test Runner
const defaultProvider = await getDefaultProvider(workspaceId)

// Uses OpenAI (configured as default)
const result = await executeWithProvider(promptId, variables, defaultProvider)
```

### Option 2: Override Per Prompt
```typescript
// In Prompt settings
// User can select "Always use Anthropic for this prompt"

const override = await getPromptProviderOverride(promptVersionId)
const provider = override?.provider || defaultProvider

const result = await executeWithProvider(promptId, variables, provider)
```

### Option 3: Manual Selection
```typescript
// In Test Runner UI
// User selects from dropdown of available providers
// Executes with selected provider
```

---

## Workflow Example

### Setup (First Time)

1. Go to `/settings`
2. Click "Add Provider"
3. Select "OpenAI"
4. Enter API key from platform.openai.com
5. Select default model (e.g., "gpt-4")
6. Click "Test" to verify connection
7. Save configuration
8. (Optional) Add more providers

### Add Second Provider

1. Click "Add Provider"
2. Select "Anthropic"
3. Enter API key from console.anthropic.com
4. Configure Claude model
5. Test connection
6. Save

### Use in Prompts

1. Create/edit prompt
2. Choose which provider to use:
   - "Use workspace default"
   - "Always use this specific provider"
3. Test prompt (uses selected provider)
4. See cost breakdown by provider

### Monitor Usage

1. Settings page shows per-provider stats
2. Cost tracking by provider
3. Token usage by provider
4. Success rates by provider

---

## Switching Providers

### Scenario 1: Try Claude for cost savings

1. **Before**: Using GPT-4 ($0.06/M tokens output)
2. **After**: Switch to Claude Sonnet ($0.15/M tokens output)
3. **Result**: See cost difference in test runner

### Scenario 2: Emergency failover

1. **Primary provider**: OpenAI down
2. **Switch to**: Anthropic Claude
3. **Just change default** in Settings
4. All future prompts use Claude

### Scenario 3: Test different models

1. Add 3 configs:
   - "Testing GPT-4"
   - "Testing Claude"
   - "Testing Cohere"
2. Test same prompt with each
3. Compare outputs and costs
4. Keep the best one as default

---

## Cost Comparison

The Settings page shows pricing for each provider:

```
OpenAI:
  GPT-4: $0.03/$0.06 per M tokens
  GPT-3.5: $0.50/$1.50 per M tokens

Anthropic:
  Claude 3 Opus: $0.015/$0.75 per M tokens
  Claude 3 Sonnet: $0.003/$0.15 per M tokens
  Claude 3 Haiku: $0.0025/$0.0125 per M tokens

Cohere:
  Command: $0.001/$0.001 per M tokens
  Command Light: $0.0003/$0.0006 per M tokens

Azure:
  Pricing varies based on Azure plan

Ollama (Local):
  FREE (runs locally)
```

---

## API Key Security

### Encryption

```typescript
// Before storing
const encrypted = encryptApiKey(apiKey)  // Using AES-256

// When needed
const decrypted = decryptApiKey(encrypted)

// Never logged or exposed
console.log(config)  // Shows "api_key_encrypted: ****"
```

### Best Practices

1. ✅ Use environment variables for keys
2. ✅ Rotate keys periodically
3. ✅ Use different keys for different environments
4. ✅ Never commit keys to Git
5. ✅ Only enable who needs access

---

## Feature Flags

### Per-Configuration

**is_enabled**: Can disable without deleting
- Useful for rotating keys
- Quick on/off toggle
- Preserves usage history

**is_default**: Used when no override specified
- Only one per workspace
- Fallback for all prompts
- Can change anytime

**is_public**: Team can use this provider
- Share across team
- Still tracks individual costs
- Admin can restrict

---

## Testing Connection

### Before Using a Provider

```typescript
// Click "Test" button
handleTestConnection(configId)

// Tests:
1. Valid API key
2. Can authenticate
3. Model exists
4. Can make a request
5. Response parsing works

// Result
✓ Connection successful!
✓ Ready to use
✓ Last tested: 2 hours ago
```

---

## Pricing Calculation

### Automatic Cost Tracking

```typescript
// When executing with a provider
const response = executePrompt(provider, prompt, variables)

// Extracts
inputTokens = 427
outputTokens = 156

// Calculates cost
pricing = getModelPricing(provider, model)
cost = (inputTokens / 1M) * pricing.input + 
        (outputTokens / 1M) * pricing.output

// Stores
updateProviderStats(configId, {
  tokens: inputTokens + outputTokens,
  cost,
  success: true
})
```

### Visible in Settings

Per provider configuration:
- Total cost spent: $3.45
- Total tokens: 125,430
- Requests made: 247
- Avg cost/request: $0.014

---

## Not Limited to Claude!

### Before (If it were Claude-only)
```typescript
// Hard-coded
const api = new AnthropicAPI(apiKey)
const result = api.executePrompt(prompt)
// No choice, always Claude
```

### After (Flexible)
```typescript
// User can choose
const provider = await getDefaultProvider(workspaceId)
// Could be OpenAI, Claude, Cohere, Azure, or Local Ollama

const result = await executeWithProvider(prompt, provider)
// Works with any provider
```

---

## Summary

✅ **NOT Claude-specific** - supports 5+ providers
✅ **Easy configuration** - Settings page with UI
✅ **Multiple instances** - Can have 3 OpenAI configs, 2 Claude configs, etc.
✅ **Cost tracking** - See spending per provider
✅ **Easy switching** - Change default provider in one click
✅ **Secure** - API keys encrypted and never exposed
✅ **Testable** - Verify connection before using
✅ **Flexible** - Per-prompt overrides possible

You can freely switch between **OpenAI, Claude, Cohere, Azure, and local Ollama models** anytime! 🎯

