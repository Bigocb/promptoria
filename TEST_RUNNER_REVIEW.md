# Test Runner Review & Implementation Status

**Date:** April 20, 2026  
**Status:** 🟡 PARTIALLY IMPLEMENTED (Backend ✅ / Frontend 🟡 / UX ❌)  
**Priority:** 🔴 CRITICAL BLOCKER for MVP launch

---

## Executive Summary

The test runner is **mostly working** but has several issues preventing production use:

- ✅ Backend fully implemented (Claude API integration, token counting, latency tracking)
- ✅ Database schema complete (TestRun model with all required fields)
- 🟡 Frontend UI exists but has bugs and missing features
- ❌ Model selection broken (hardcoded to Ollama models that don't exist)
- ❌ Missing cost estimation (important for paid tiers)
- ❌ No comparison/A/B testing features
- ⚠️ Error handling could be better

**To make production-ready: 1-2 days of focused work**

---

## ✅ What's Working

### Backend (Perfect)
**File:** `/app/api/test-runs/route.ts`

- ✅ Receives prompt_version_id + variables
- ✅ Substitutes variables into prompt template
- ✅ Calls Claude API (supports custom model + temperature + max_tokens)
- ✅ Stores results in database (TestRun table)
- ✅ Tracks: execution time (ms), token counts, status, error messages
- ✅ Proper auth & workspace isolation
- ✅ SyncLog tracking for audit trail
- ✅ Handles API key from user settings OR environment

**Code Quality:** ⭐⭐⭐⭐⭐

### GET & DELETE Endpoints (Complete)
**File:** `/app/api/test-runs/[id]/route.ts`

- ✅ Get single test run with full context
- ✅ Delete test run with proper cleanup
- ✅ Ownership verification
- ✅ Proper error handling

### Database Schema (Complete)
```prisma
model TestRun {
  id                String   @id @default(cuid())
  workspace_id      String
  prompt_version_id String
  test_case_input   String   @db.Text
  output            String?  @db.Text
  status            String   @default("pending")  // pending, running, success, error
  error_message     String?  @db.Text
  duration_ms       Int?     // execution latency
  completed_at      DateTime?
  // ... workspace + prompt_version relations
}
```

---

## 🟡 Frontend Issues

### Issue 1: Model Selection is Broken ⚠️

**Current State:**
```typescript
// Line 2034-2078 in /app/prompts/page.tsx
const [testModel, setTestModel] = useState('llama3.2')
const [ollamaModels, setOllamaModels] = useState<any[]>([])

// Tries to fetch from Ollama
const fetchOllamaModels = async () => {
  const res = await fetch('http://localhost:11434/api/tags')
  // ... expects local Ollama instance
}
```

**Problems:**
1. Hardcoded to Ollama (local only, not cloud)
2. No backend endpoint to list available Claude models
3. Falls back to static list (llama3.2, mistral, neural-chat) which don't exist
4. Frontend expects `ollamaModels[].id` and `ollamaModels[].family`
5. Users can't select Claude models (which is what the backend actually uses)

**Solution Needed:**
Create `/api/models` endpoint that returns available models (Claude Opus, Sonnet, Haiku, etc.)

### Issue 2: Temperature/Token Controls Not Used

**Current State:**
```typescript
// Line 2082-2107: Frontend collects these
const [testTemperature, setTestTemperature] = useState(0.7)
const [testMaxTokens, setTestMaxTokens] = useState(500)

// But they're NOT sent to backend!
const runTest = async () => {
  // Line 814-823: Only sends prompt_version_id + variables
  const res = await fetch(API_ENDPOINTS.execute.run, {
    body: JSON.stringify({
      prompt_version_id: currentPromptVersionId,
      variables: testVariables,
      // Missing: temperature, max_tokens, model!
    })
  })
}
```

**Problem:** Backend supports these parameters but frontend doesn't send them.

### Issue 3: Test Output Display Missing Details

**Current State:**
```typescript
// Just shows raw text output
{testOutput && (
  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
    {testOutput}
  </div>
)}
```

**Missing:**
- ❌ Token count display
- ❌ Execution time display
- ❌ Cost estimation
- ❌ Model used display
- ❌ Status indicator (success/error)
- ❌ Copy-to-clipboard button

### Issue 4: Test History Not Functional

**Current State:**
```typescript
// Line 2158-2193: Shows history but doesn't load from API
{testResults.length > 0 && (
  <div>
    {testResults.map((result) => (
      <button onClick={() => setTestOutput(result.output)}>
        {result.model} @ {result.timestamp}
      </button>
    ))}
  </div>
)}
```

**Problems:**
1. Only shows tests run in current session (stored in local state)
2. Doesn't load from API on page load
3. No persistence between page reloads
4. No ability to compare/A/B test results

---

## 🚀 What's Needed for MVP

### Critical (Blocking) — 2-4 hours
1. **Fix Model Selection**
   - Create `/api/models` endpoint listing Claude models
   - Update frontend to send selected model to backend
   - Update frontend to send temperature + max_tokens to backend

2. **Enhance Output Display**
   - Show token count (backend returns this via message.usage)
   - Show execution time
   - Show cost calculation (based on token count)
   - Show model name + temperature used

3. **Load Test History from API**
   - Call `GET /test-runs?prompt_version_id=X` on mount
   - Display paginated history
   - Allow clicking history items to view

### Important (Not blocking) — 2-3 hours
4. **Better Error Handling**
   - Show error messages from backend
   - Add retry button on failure
   - Show which field caused error

5. **Cost Estimation**
   - Calculate price per model:
     - Claude Opus: ~$15/$45 per 1M tokens
     - Claude Sonnet: ~$3/$15 per 1M tokens
     - Claude Haiku: ~$0.25/$1.25 per 1M tokens
   - Display cost before/after test run
   - Show total spend this month

### Nice-to-Have (Polish) — 2-3 hours
6. **A/B Testing**
   - Compare two test runs side-by-side
   - Show diff between outputs
   - Rate which output is better

7. **Bulk Testing**
   - Run same prompt with multiple input variations
   - See results in table format

8. **Export Results**
   - Download test runs as JSON/CSV
   - Share test results link

---

## Implementation Checklist

### Tier 1: Make it Work (MUST DO) ⭐
- [ ] Create `/api/models` endpoint returning Claude models
- [ ] Fix frontend to send model, temperature, max_tokens to backend
- [ ] Update test output display to show tokens, time, cost
- [ ] Load and display test history from API

**Time estimate:** 3-4 hours  
**Branch:** `feature/test-runner-fix`

### Tier 2: Make it Polish (SHOULD DO)
- [ ] Add cost per model configuration
- [ ] Better error messages and retry logic
- [ ] Delete test run UI button in history
- [ ] Copy output button

**Time estimate:** 2 hours

### Tier 3: Make it Great (NICE TO HAVE)
- [ ] A/B comparison UI
- [ ] Bulk test runner
- [ ] Export functionality
- [ ] Test result sharing

**Time estimate:** 3-4 hours

---

## Code Changes Needed

### 1. Create `/app/api/models/route.ts` (NEW FILE)
```typescript
// Return list of available Claude models
// Should return: { models: [{ id, name, inputPrice, outputPrice }, ...] }

export async function GET(request: NextRequest) {
  return NextResponse.json({
    models: [
      { 
        id: 'claude-opus-4-6', 
        name: 'Claude Opus 4.6', 
        inputPrice: 15, 
        outputPrice: 45 
      },
      { 
        id: 'claude-sonnet-4-6', 
        name: 'Claude Sonnet 4.6', 
        inputPrice: 3, 
        outputPrice: 15 
      },
      { 
        id: 'claude-haiku-4-5-20251001', 
        name: 'Claude Haiku', 
        inputPrice: 0.25, 
        outputPrice: 1.25 
      },
    ]
  })
}
```

### 2. Update `/app/api/test-runs/route.ts` (MODIFY)
Already supports model, temperature, max_tokens in request body.  
**Issue:** Backend doesn't actually use the passed `temperature` — it uses the model config from PromptVersion.model_config.

**Fix needed:** Check if model_config exists, use those values or override with passed values.

### 3. Update `/app/prompts/page.tsx` — runTest function (MODIFY)
```typescript
const runTest = async () => {
  // ... existing code ...
  
  const res = await fetch(API_ENDPOINTS.execute.run, {
    method: 'POST',
    headers: { /* ... */ },
    body: JSON.stringify({
      prompt_version_id: currentPromptVersionId,
      variables: testVariables,
      // ADD THESE:
      model: testModel,           // Currently selected model
      temperature: testTemperature, // Currently selected temp
      max_tokens: testMaxTokens,   // Currently selected max tokens
    })
  })
  
  // ... rest of code ...
}
```

### 4. Update Test Output Display (MODIFY)
```typescript
// Instead of just showing testOutput, show structured data:
{testOutput && (
  <div>
    <div style={{ marginBottom: '0.5rem' }}>
      <p>✓ Success</p>
      <p>Model: {lastTestRun.model}</p>
      <p>Tokens: {lastTestRun.totalTokens} (${cost.toFixed(4)})</p>
      <p>Time: {lastTestRun.latency_ms}ms</p>
    </div>
    <pre style={{ maxHeight: '150px', overflowY: 'auto' }}>
      {testOutput}
    </pre>
  </div>
)}
```

### 5. Load Test History from API (NEW)
```typescript
// On component mount or when prompt changes:
const loadTestHistory = async () => {
  const res = await fetch(
    API_ENDPOINTS.execute.history(currentPromptVersionId),
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  const data = await res.json()
  setTestResults(data.test_runs || [])
}

// Call in useEffect when prompt loads
useEffect(() => {
  if (currentPromptVersionId) {
    loadTestHistory()
  }
}, [currentPromptVersionId])
```

---

## Testing Checklist

Before marking as done:
- [ ] Can select different Claude models
- [ ] Temperature changes are sent to API
- [ ] Max tokens changes are sent to API
- [ ] Test output shows cost and token count
- [ ] Test history loads on page load
- [ ] Can click history item to view past test
- [ ] Error messages display properly
- [ ] Works with variable substitution
- [ ] Cost calculation is correct

---

## Timeline to MVP

**If you do Tier 1 only (3-4 hours of focused work):**
- Test runner will be production-ready
- Enables users to validate prompts
- Ready to market and demo

**Current blockers removing:**
- ✅ Broken model selection
- ✅ Missing output details
- ✅ Test history not loading
- ✅ Parameters not being sent to API

**Remaining TODOs for "great" version:**
- Cost estimation (nice to have but important for enterprise)
- A/B comparison (good differentiator)
- Bulk testing (workflow improvement)
