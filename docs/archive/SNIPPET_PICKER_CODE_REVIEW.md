# Snippet Picker Feature — Code Review & Analysis

**Date:** April 19, 2026  
**Reviewer:** Claude  
**Status:** Partially Implemented (Backend ✅ / Frontend 🟡 / UX ❌)

---

## Executive Summary

The snippet picker feature has a **solid backend** but an **incomplete frontend**. Snippets can be created, edited, and deleted (data persists), but the composition/picker experience doesn't meet the backlog requirements.

- **Backend Status:** ✅ Production-ready CRUD endpoints
- **Frontend Status:** 🟡 Basic insertion working, advanced features missing
- **UX Status:** ❌ No search, no drag-drop, no composition management
- **Code Quality:** Good (auth, workspace isolation, sync logging all correct)

---

## Part 1: Backend Analysis

### What Exists (and Works)

**Endpoints:**
```
POST   /api/snippets           → Create
GET    /api/snippets           → List (paginated)
GET    /api/snippets/{id}      → Detail
PUT    /api/snippets/{id}      → Update
DELETE /api/snippets/{id}      → Delete
```

**Files:**
- `/app/api/snippets/route.ts` — POST/GET (list)
- `/app/api/snippets/[id]/route.ts` — GET/PUT/DELETE

**Implementation Quality:** ⭐⭐⭐⭐⭐
- ✅ JWT token verification on all endpoints
- ✅ Workspace isolation (users can only see their own snippets)
- ✅ Pagination support (skip/take params)
- ✅ SyncLog tracking for all CRUD operations
- ✅ Proper error handling (401/403/404/400)
- ✅ Consistent response format

**Why snippets persist between logins:**  
Prisma saves to PostgreSQL with workspace_id, so data survives browser close/login cycles.

---

## Part 2: Frontend Implementation

### What Works ✅

**Snippet creation/management:**
- Users can create, edit, delete snippets (in `/app/snippets` page)
- Snippets display in workbench panel
- Basic click-to-insert functionality

**Current insertion code (line 475-478 of `/app/prompts/page.tsx`):**
```typescript
const insertSnippet = (snippet: Snippet) => {
  const insertion = `[SNIPPET: ${snippet.name}]\n${snippet.content}\n`
  setPromptContent(promptContent + insertion)
}
```

### What's Missing ❌

According to BACKLOG.md, snippet picker should support:

| Feature | Status | Notes |
|---------|--------|-------|
| Search/filter snippets | ❌ | No input field, full list always shown |
| Drag-and-drop composition | ❌ | Just click-to-append |
| Reorder/remove snippets | ❌ | Once inserted, can only edit in prompt text |
| Template variable editing | ❌ | No inline `{var}` editing UI |
| Live preview | ❌ | No preview pane shown |
| Composition tracking | ❌ | System doesn't know which snippets were used |

**Current UX is minimal:**
1. User clicks snippet button
2. Text appends to prompt as `[SNIPPET: name]\ncontent\n`
3. No way to manage, reorder, or preview composition

**Expected UX (from backlog):**
1. Search for snippets by name/tag
2. Drag snippets into composition area
3. Reorder/remove by drag or buttons
4. Edit `{variable}` placeholders
5. See compiled result in live preview

---

## Part 3: Library Categories Bug

### Root Cause

The library page crashes/shows "0 prompts" in categories because:

**What works:**
- ✅ Backend saves `category_id` when creating/updating prompts
- ✅ `GET /api/prompts/{id}` returns the `category_id`

**What's missing:**
- ❌ No endpoint to fetch **categories WITH their associated prompts**

**Current flow:**
```typescript
// Frontend tries to do something like:
const categories = await fetch('/api/categories')
// Response is missing the "prompts" array for each category

// So component tries to render:
category.prompts?.length  // → undefined, shows 0
```

**Fix needed:**
```
GET /api/categories?workspace_id=X
→ Response includes associated prompts for each category
```

**This is a 2-3 hour fix** (create one new endpoint that JOINs categories to prompts).

---

## Code Quality Issues

### Issue 1: Insertion Logic is Simplistic

**Current:**
```typescript
const insertion = `[SNIPPET: ${snippet.name}]\n${snippet.content}\n`
setPromptContent(promptContent + insertion)
```

**Problems:**
- Uses user-facing marker `[SNIPPET: name]` (unprofessional)
- No composition tracking — system doesn't know what was inserted
- Can't reorder, remove, or edit inserted snippets without manual text editing
- Variable conflicts not detected (same `{var}` in multiple snippets)

**Better approach:**
- Track inserted snippets in state: `{ snippetId, order, variables }`
- Compile on demand: merge snippets → replace variables → show result
- Allow reorder/remove via UI, not text editing

### Issue 2: Fetch Error Handling

**Current:**
```typescript
const fetchSnippets = async () => {
  try {
    const res = await fetch(API_ENDPOINTS.snippets.list, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await res.json()
    setSnippets(Array.isArray(data) ? data : data.snippets || [])
```

**Problems:**
- Defensive fallback `data.snippets || []` suggests API contract unclear
- No error handling if response is 401 (token expired)
- No user feedback if fetch fails (just silent empty list)
- Should show error state or toast notification

### Issue 3: Snippet Panel Mobile UX

**Current:** Hidden behind mobile section tab  
**Issue:** On mobile, snippet panel is tucked away — not accessible while composing

---

## Comparison: Expected vs Actual

### Backlog Promise
```
### Prompt Workspace
- [ ] Snippet picker component (search/filter)
- [ ] Drag-and-drop composition builder
- [ ] Template variable inline editing
- [ ] Live preview compilation
- **Estimated: 2-3 days**
```

### Actual Implementation
- ✅ Snippet CRUD works (backend)
- ✅ Basic snippet panel exists
- ❌ No search/filter
- ❌ No drag-drop (just click)
- ❌ No variable editing
- ❌ No live preview
- ❌ No composition management

**Completion:** ~30% of backlog promise

---

## Recommendations (Priority Order)

### BLOCKING (Do First)
1. **Create categories endpoint** (2-3 hours)
   - `GET /api/categories?workspace_id=X` returning categories + prompts
   - Fixes library display bug immediately

2. **Add search/filter to snippets** (2-4 hours)
   - Input field to filter snippets by name/description
   - Quick win that makes picker usable with many snippets

### HIGH (Complete Feature)
3. **Implement composition tracking** (1-2 days)
   - State to track: `{ snippetId, position, variables }`
   - Show panel of "inserted snippets" with remove/reorder buttons
   - Compile prompt: merge snippets → substitute variables → show result

4. **Add drag-and-drop** (1-2 days)
   - Replace click-to-append with drag from panel to composition area
   - Drag within composition to reorder

### MEDIUM (Polish)
5. **Inline variable editing** (1 day)
   - UI to edit `{variable}` names when snippet inserted
   - Detect variable conflicts across snippets

6. **Live preview pane** (1 day)
   - Show compiled prompt as you compose
   - Update in real-time as variables change

### NICE-TO-HAVE
7. **Snippet tags/folders** (1-2 days)
   - Backend already supports `folder_id`
   - Add folder/tag filtering to snippet list

---

## Files Involved

**Backend (Complete):**
- `/app/api/snippets/route.ts` (POST/GET)
- `/app/api/snippets/[id]/route.ts` (GET/PUT/DELETE)
- Prisma Snippet model

**Frontend (Incomplete):**
- `/app/prompts/page.tsx` — Snippet panel (lines 1736-1780)
- `/app/prompts/page.tsx` — insertSnippet() function (lines 475-478)
- `/app/snippets/page.tsx` — Snippet library page (full CRUD UI)
- Missing: Composition builder component

**Missing:**
- `/app/api/categories/route.ts` — GET endpoint with JOINed prompts
- Snippet composer/picker component (search + drag-drop + composition UI)

---

## Conclusion

**The infrastructure is solid, but the feature is half-done.**

Snippets work as a data layer (create, read, update, delete, persist), but the **composition experience** falls short of backlog promises. The current "click to insert" is a starting point, not a finished feature.

**Next steps:**
1. ✅ Accept that snippet CRUD backend is production-ready
2. ❌ Recognize that picker UX needs 3-4 days of frontend work
3. 🔧 Build composition tracker + drag-drop + search in priority order
4. 🔧 Create categories endpoint to fix library bug (quick win)

**Estimated effort to complete:** 3-5 days of frontend work
