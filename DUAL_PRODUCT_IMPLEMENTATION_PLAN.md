# Promptoria Dual-Product Implementation Plan
## Promptoria PRO + PromptJar (Consumer Recipe Book)

**Status:** Active — Revised based on actual codebase audit  
**Version:** 1.1  
**Last Updated:** April 25, 2026  
**Maintainer:** Product Manager / Lead Engineer  

---

## How to Use This Plan

- [ ] Each task uses a markdown checkbox: `- [ ]`
- [ ] Agents MUST update checkboxes as tasks are completed: `- [x]`
- [ ] Each phase has dependencies noted. Do not skip phases.
- [ ] Before starting a phase, read the **Prerequisites** section at the top of that phase.
- [ ] After completing a phase, run the **Phase Gate Checklist** before proceeding.
- [ ] **IMPORTANT:** `BACKLOG.md` and `FEATURES.md` contain stale entries. Trust this plan and the actual code, not the markdown checklists.

---

## Critical Context: Backlog vs. Reality

`BACKLOG.md` and `FEATURES.md` have not been updated to reflect recent work. Based on live code audit (April 25, 2026):

| Backlog / Features Claim | Actual Code State |
|---|---|
| "Favorites — API stub only logs to SyncLog" | **FALSE.** `Favorite` model exists with proper Prisma relations. `POST/DELETE/GET /api/prompts/[id]/favorite` all persist real records. |
| "History page uses hardcoded mock data" | **FALSE (backend).** `GET /api/test-runs` queries real Prisma data. UI is wired. |
| "Tag suggestions API exists but no UI surface" | **FALSE.** UI is wired; the API is surfaced. |
| "Privacy policy page — not started" | **FALSE.** `app/privacy/page.tsx` shipped with real content. |
| "Terms of service page — not started" | **FALSE.** `app/terms/page.tsx` shipped with real content. |
| "Input validation layer (Zod)" | **TRUE.** Not implemented. No Zod in codebase. |
| "Template seeding in database" | **TRUE.** Still hardcoded JS array in `/api/templates/route.ts`. Needs real DB table. |
| "Rate limit on all API endpoints" | **TRUE.** Only auth endpoints are rate-limited. |

**Rule:** If this plan conflicts with `BACKLOG.md`, trust this plan. If this plan conflicts with actual code, trust the code and flag it.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Phase 0: Environment & Prerequisites](#2-phase-0-environment--prerequisites)
3. [Phase 1: Backend Hardening (Zod + Errors + Rate Limits)](#3-phase-1-backend-hardening-zod--errors--rate-limits)
4. [Phase 2: Auth & Identity Layer (Shared)](#4-phase-2-auth--identity-layer-shared)
5. [Phase 3: Consumer API v1 (PromptJar-Optimized Endpoints)](#5-phase-3-consumer-api-v1-PromptJar-optimized-endpoints)
6. [Phase 4: Schema Additions (Collections, Sharing, Search)](#6-phase-4-schema-additions-collections-sharing-search)
7. [Phase 5: Sync Infrastructure (Mobile-Ready)](#7-phase-5-sync-infrastructure-mobile-ready)
8. [Phase 6: Content & Template Library](#8-phase-6-content--template-library)
9. [Phase 7: PromptJar Frontend (React Native MVP)](#9-phase-7-PromptJar-frontend-react-native-mvp)
10. [Phase 8: PRO Web Polish & Feature Completion](#10-phase-8-pro-web-polish--feature-completion)
11. [Phase 9: Launch & Go-to-Market](#11-phase-9-launch--go-to-market)
12. [Appendix: API Contract Reference](#12-appendix-api-contract-reference)
13. [Appendix: Database Migration Log](#13-appendix-database-migration-log)

---

## 1. Executive Summary

### Goal
Ship **Promptoria PRO** (developer-grade prompt workbench) and **PromptJar** (consumer "Pinterest for Prompts" recipe book) from a **single backend**.

### Core Principle
> **"Same tables, different shapes."**

The PostgreSQL database and Prisma schema remain the source of truth. PRO and PromptJar both read from the same data, but PromptJar hits a `/api/v1/*` namespace that returns simplified, flattened, user-friendly shapes.

### Current Ground Truth (April 2026)
- **PRO Web App:** Backend is solid and largely feature-complete. Auth, prompts, versions, snippets, test runs, favorites, search, privacy/terms pages are all **shipped and working**.
- **Remaining PRO gaps:** Zod validation, expanded rate limiting, Sentry, Redis caching.
- **Template library:** Still a 5-item hardcoded JS array. Needs real DB table + seeding.
- **PromptJar:** Does not exist yet. Needs entire `/api/v1/*` API surface + React Native app.

### Timeline Estimate
| Phase | Duration | Cumulative |
|---|---|---|
| Phase 0: Environment | 1 day | Day 1 |
| Phase 1: Backend Hardening | 2 days | Day 3 |
| Phase 2: Auth Layer | 1 day | Day 4 |
| Phase 3: Consumer API v1 | 5–7 days | Day 11 |
| Phase 4: Schema Additions | 2–3 days | Day 14 |
| Phase 5: Sync Infrastructure | 3–4 days | Day 18 |
| Phase 6: Content & Templates | 3 days (parallel) | Day 21 |
| Phase 7: PromptJar Frontend MVP | 2–3 weeks | Day 42 |
| Phase 8: PRO Polish | 1 week (parallel) | Day 49 |
| Phase 9: Launch | 1 week | Day 56 |

**Total time to MVP:** ~8 weeks with 1–2 engineers.

---

## 2. Phase 0: Environment & Prerequisites

**Prerequisites:**
- [ ] Repository cloned and `npm install` works.
- [ ] PostgreSQL running locally.
- [ ] `.env.local` configured (DATABASE_URL, JWT_SECRET, OLLAMA_BASE_URL, etc.).
- [ ] `npm run db:push` succeeds.
- [ ] `npm run dev` starts without errors.
- [ ] You can log in and see the dashboard.

**Tasks:**
- [ ] **0.1** Verify all current tests pass (if any exist). Run `npm test` or equivalent.
- [ ] **0.2** Create a dedicated feature branch: `git checkout -b dual-product`.
- [ ] **0.3** Verify the current `schema.prisma` matches the deployed database state.
- [ ] **0.4** Do NOT trust `BACKLOG.md` or `FEATURES.md` as sources of truth. Use them as hints, then verify in code.

**Phase 0 Gate:**
- [ ] Can create a user, log in, create a prompt, run a test, favorite it, and see it in history.
- [ ] No uncommitted changes on `main` before branching.

---

## 3. Phase 1: Backend Hardening (Zod + Errors + Rate Limits)

**Prerequisites:** Phase 0 complete.

**Why:** The PRO backend is functional but lacks validation and robust rate limiting. Hardening before building PromptJar prevents bad data from leaking into the consumer product.

### 1.1 Input Validation Layer (Zod)

- [ ] **1.1.1** Install Zod: `npm install zod`.
- [ ] **1.1.2** Create `lib/validation.ts` with schemas for:
  - [ ] `PromptCreateSchema`
  - [ ] `PromptUpdateSchema`
  - [ ] `SnippetSchema`
  - [ ] `LoginSchema`
  - [ ] `SignupSchema`
  - [ ] `RecipeCreateSchema` (for v1 API)
  - [ ] `CollectionSchema` (for v1 API)
- [ ] **1.1.3** Apply Zod validation to `POST /api/prompts`.
- [ ] **1.1.4** Apply Zod validation to `POST /api/snippets`.
- [ ] **1.1.5** Apply Zod validation to `POST /api/auth/login` and `POST /api/auth/signup`.
- [ ] **1.1.6** Return structured error messages from validation failures.

### 1.2 Consistent Error Handling

- [ ] **1.2.1** Create `lib/errors.ts` with standard error response shapes.
- [ ] **1.2.2** Create `handleApiError()` helper that wraps try/catch in API routes.
- [ ] **1.2.3** Refactor top 5 most critical API routes (prompts, snippets, auth) to use `handleApiError()`.
- [ ] **1.2.4** Ensure all error responses follow: `{ "error": "Descriptive message", "code": "ERROR_CODE" }`.

### 1.3 Expanded Rate Limiting

- [ ] **1.3.1** Implement rate limiting on all non-auth API endpoints (100 req/min per user).
  - [ ] Use existing `rate-limit.ts` pattern but expand to general API routes.
  - [ ] Key strategy: `rateLimit("api:${userId}")` or `api:${ip}`.
- [ ] **1.3.2** Implement rate limiting on test execution endpoints (10 req/min per user).
- [ ] **1.3.3** Add rate limit headers to responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

**Phase 1 Gate:**
- [ ] Zod rejects invalid payloads with clear error messages.
- [ ] API routes return consistent error shapes.
- [ ] Rate limits block excessive requests and return proper 429 responses.

---

## 4. Phase 2: Auth & Identity Layer (Shared)

**Prerequisites:** Phase 1 complete.

### 2.1 Enhance JWT with Client Context

- [ ] **2.1.1** Modify `lib/jwt.ts`: Update `generateAccessToken(...)` to accept optional `clientType: 'pro' | 'promptjar'`.
  ```typescript
  // New signature
  export function generateAccessToken(
    userId: string,
    email: string,
    clientType?: 'pro' | 'promptjar'
  ): string
  ```
- [ ] **2.1.2** Update payload to include `client_type` claim.
- [ ] **2.1.3** Update `verifyAccessToken()` to return `clientType` alongside `userId` and `email`.
- [ ] **2.1.4** Update login/signup endpoints to accept optional `client_type` in body, default to `'pro'`.
- [ ] **2.1.5** Update refresh token endpoint to preserve `client_type` in new access token.

### 2.2 Create Product-Aware Middleware

- [ ] **2.2.1** Create `lib/product-filter.ts`:
  ```typescript
  export function filterForProduct(data: any, clientType: 'pro' | 'promptjar'): any
  export function stripSensitiveFields(data: any): any  // Removes API keys, internal IDs
  ```
- [ ] **2.2.2** Create `lib/api-guard.ts` with `requireAuth()` helper that returns `{ userId, email, clientType }`.
- [ ] **2.2.3** Refactor at least 3 existing PRO API routes to use `requireAuth()` (test the pattern).

### 2.3 Device Registration (Mobile Prep)

- [ ] **2.3.1** Verify `POST /api/devices/register` works and stores `device_type`, `device_name`, `app_version`.
- [ ] **2.3.2** Create `GET /api/devices` endpoint to list registered devices for a user.
- [ ] **2.3.3** Create `DELETE /api/devices/:id` to deregister devices.
- [ ] **2.3.4** Update login response to include list of registered devices.

**Phase 2 Gate:**
- [ ] JWT tokens contain `client_type` claim.
- [ ] `requireAuth()` middleware returns `clientType`.
- [ ] Device registration flow tested end-to-end.
- [ ] No breaking changes to existing PRO login/signup.

---

## 5. Phase 3: Consumer API v1 (PromptJar-Optimized Endpoints)

**Prerequisites:** Phase 2 complete.

**Goal:** Create `/api/v1/*` endpoints that wrap existing Prisma calls but return simplified, consumer-friendly shapes.

### 3.1 Create v1 Directory Structure

- [ ] **3.1.1** Create `app/api/v1/` directory.
- [ ] **3.1.2** Create shared helpers in `app/api/v1/lib/`:
  - [ ] `requireConsumerAuth.ts` — validates JWT, reads `client_type`.
  - [ ] `shape-recipe.ts` — transforms Prompt → Recipe shape.
  - [ ] `shape-collection.ts` — transforms Collection → consumer shape.

### 3.2 Recipes Endpoints (PromptJar's View of Prompts)

**Shape definition:**
```typescript
interface Recipe {
  id: string;
  name: string;
  description: string | null;
  body: string;              // From PromptVersion.template_body
  tags: string[];
  category: string | null;   // Flattened category name
  folder: string | null;     // Consumer-friendly alias for category
  isFavorited: boolean;
  likes: number;             // Future public sharing
  variables: string[];       // Extracted {{var}} names
  created_at: string;
  updated_at: string;
  // NOTE: No versions array. No compositions. No test_runs.
}
```

- [ ] **3.2.1** `GET /api/v1/recipes`
  - [ ] Paginated (`skip`, `take`, max 100).
  - [ ] Supports `?q=` search (name/description search for now; full-text later).
  - [ ] Supports `?category=` filter.
  - [ ] Supports `?favorited=true` filter.
  - [ ] Returns `Recipe[]` shape.
  - [ ] Include `isFavorited` by checking `Favorite` table for current user.
- [ ] **3.2.2** `GET /api/v1/recipes/:id`
  - [ ] Returns single `Recipe` shape.
  - [ ] Extract `{{variable_name}}` from `template_body` and return as `variables: string[]`.
- [ ] **3.2.3** `POST /api/v1/recipes`
  - [ ] Accepts: `{ name, description, body, tags?, category_id? }`.
  - [ ] Ignores `change_log`, `model_config`. Creates version 1 silently with `change_log: "Created in PromptJar"`.
  - [ ] Returns `Recipe` shape.
- [ ] **3.2.4** `PUT /api/v1/recipes/:id`
  - [ ] Accepts: `{ name, description, body, tags?, category_id? }`.
  - [ ] Updates in place from consumer perspective. **Under the hood:** creates new `PromptVersion` then marks it `is_active`. This preserves PRO's versioning but hides it from PromptJar.
  - [ ] Returns updated `Recipe` shape.
- [ ] **3.2.5** `DELETE /api/v1/recipes/:id`
  - [ ] Hard delete. PromptJar is personal data.
  - [ ] Returns `{ success: true }`.

### 3.3 Categories v1 (Flattened)

- [ ] **3.3.1** `GET /api/v1/categories`
  - [ ] Returns flat list: `{ id, name, description, recipe_count }`.
  - [ ] Ignores `AgentInteractionType` hierarchy. Flattens all categories across all interaction types.
  - [ ] Include `recipe_count` for consumer UI.
- [ ] **3.3.2** `POST /api/v1/categories`
  - [ ] Creates a top-level category (no interaction type required).
  - [ ] Consumer just types a folder name.

### 3.4 Templates v1

- [ ] **3.4.1** `GET /api/v1/templates`
  - [ ] Returns expanded list from database (not hardcoded JS array).
  - [ ] Supports `?category=` filter.
  - [ ] Supports pagination.
- [ ] **3.4.2** `POST /api/v1/templates/:id/use`
  - [ ] Accepts: `template_id`.
  - [ ] Clones template into user's workspace as a new Recipe/Prompt.
  - [ ] Returns new `Recipe`.

### 3.5 "Try It" Execution v1

- [ ] **3.5.1** `POST /api/v1/recipes/:id/try`
  - [ ] Accepts: `{ variables: { key: value } }`.
  - [ ] Reads the active `PromptVersion`.
  - [ ] Substitutes variables into `template_body`.
  - [ ] Calls AI provider (uses user's default model or cheapest free model).
  - [ ] Returns: `{ response: string, tokens_used: number, latency_ms: number }`.
  - [ ] Does NOT persist as a TestRun. This is ephemeral for consumers.

### 3.6 Favorites v1

- [ ] **3.6.1** `POST /api/v1/recipes/:id/favorite`
  - [ ] Toggles favorite status.
  - [ ] Returns `{ isFavorited: boolean }`.
- [ ] **3.6.2** `GET /api/v1/recipes/favorites`
  - [ ] Returns favorited recipes for current user.

### 3.7 Search v1

- [ ] **3.7.1** `GET /api/v1/search?q=...`
  - [ ] Searches across `Prompt.name`, `PromptVersion.template_body` (active only), `Snippet.name`, `Snippet.content`.
  - [ ] Returns unified results: `{ recipes: [...], snippets: [...] }`.
  - [ ] This is a temporary endpoint until Phase 4 full-text search is ready.

**Phase 3 Gate:**
- [ ] All v1 endpoints return non-breaking JSON shapes.
- [ ] v1 endpoints are tested with curl/Postman/HTTP client.
- [ ] v1 endpoints do NOT leak PRO concepts (versions, compositions, test_runs) in responses.
- [ ] PRO endpoints remain untouched and functional.

---

## 6. Phase 4: Schema Additions (Collections, Sharing, Search)

**Prerequisites:** Phase 3 complete.

### 4.1 Visibility & Sharing

- [ ] **4.1.1** Add `Visibility` enum to `schema.prisma`:
  ```prisma
  enum Visibility {
    PRIVATE
    SHARED_LINK
    PUBLIC
  }
  ```
- [ ] **4.1.2** Add `visibility Visibility @default(PRIVATE)` to `Prompt` model.
- [ ] **4.1.3** Add `likes Int @default(0)` to `Prompt` model.
- [ ] **4.1.4** Create `PromptShare` model:
  ```prisma
  model PromptShare {
    id          String   @id @default(cuid())
    prompt_id   String
    share_token String   @unique  // e.g., "abc123xyz" for /s/abc123xyz
    created_by  String
    expires_at  DateTime?
    created_at  DateTime @default(now())
    prompt      Prompt   @relation(fields: [prompt_id], references: [id], onDelete: Cascade)
  }
  ```
- [ ] **4.1.5** Run `npx prisma migrate dev --name add_visibility_and_sharing`.
- [ ] **4.1.6** Update `POST /api/v1/recipes/:id/share`:
  - [ ] Accepts `{ visibility: 'SHARED_LINK' | 'PUBLIC' }`.
  - [ ] Generates `share_token`.
  - [ ] Returns `{ share_url: string }`.
- [ ] **4.1.7** Create `GET /api/v1/public/recipes/:share_token` — unauthenticated endpoint to view shared recipe.

### 4.2 Collections (Pinterest Boards)

- [ ] **4.2.1** Add `Collection` and `PromptCollection` models:
  ```prisma
  model Collection {
    id          String   @id @default(cuid())
    user_id     String
    name        String
    description String?
    cover_image String?  // URL or base64 for thumbnail
    is_public   Boolean  @default(false)
    created_at  DateTime @default(now())
    updated_at  DateTime @updatedAt
    user        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
    prompts     PromptCollection[]
  }

  model PromptCollection {
    id            String     @id @default(cuid())
    collection_id String
    prompt_id     String
    added_at      DateTime   @default(now())
    collection    Collection @relation(fields: [collection_id], references: [id], onDelete: Cascade)
    prompt        Prompt     @relation(fields: [prompt_id], references: [id], onDelete: Cascade)

    @@unique([collection_id, prompt_id])
  }
  ```
- [ ] **4.2.2** Run migration: `npx prisma migrate dev --name add_collections`.
- [ ] **4.2.3** `POST /api/v1/collections` — create collection.
- [ ] **4.2.4** `GET /api/v1/collections` — list user's collections with `recipe_count`.
- [ ] **4.2.5** `GET /api/v1/collections/:id` — get collection with recipes.
- [ ] **4.2.6** `POST /api/v1/collections/:id/recipes` — add recipe to collection.
- [ ] **4.2.7** `DELETE /api/v1/collections/:id/recipes/:recipe_id` — remove recipe from collection.
- [ ] **4.2.8** `DELETE /api/v1/collections/:id` — delete collection.

### 4.3 Full-Text Search (PostgreSQL)

- [ ] **4.3.1** Research Prisma + PostgreSQL full-text search (`to_tsvector`, `tsquery`).
- [ ] **4.3.2** Add migration to create `tsvector` columns:
  ```sql
  ALTER TABLE "prompts" ADD COLUMN search_vector tsvector;
  ALTER TABLE "prompt_versions" ADD COLUMN search_vector tsvector;
  ALTER TABLE "snippets" ADD COLUMN search_vector tsvector;
  ```
- [ ] **4.3.3** Create PostgreSQL triggers to update `search_vector` on insert/update.
- [ ] **4.3.4** Create GIN indexes on `search_vector` columns.
- [ ] **4.3.5** Create `lib/search.ts` with `searchPrompts(query: string)` function using raw Prisma query.
- [ ] **4.3.6** Update `GET /api/v1/search` to use full-text search.
- [ ] **4.3.7** Update `GET /api/v1/recipes?q=` to use full-text search.
- [ ] **4.3.8** Test: Search for "marketing email" returns relevant prompts even if word order differs.

**Phase 4 Gate:**
- [ ] New migrations applied without data loss.
- [ ] Collections API works end-to-end.
- [ ] Sharing generates a link that works when logged out.
- [ ] Full-text search returns results faster than `LIKE '%term%'`.

---

## 7. Phase 5: Sync Infrastructure (Mobile-Ready)

**Prerequisites:** Phase 4 complete.

**Why:** The current `GET /api/sync` is functional but needs production-grade pagination, device tracking, and conflict detection for PromptJar.

### 5.1 Device Sync State Table

- [ ] **5.1.1** Add `DeviceSyncState` model:
  ```prisma
  model DeviceSyncState {
    id             String   @id @default(cuid())
    device_id      String   @unique
    user_id        String
    last_sync_at   DateTime @default(now())
    sync_cursor    String?  // opaque pagination cursor
    created_at     DateTime @default(now())
    updated_at     DateTime @updatedAt

    @@index([user_id])
    @@map("device_sync_states")
  }
  ```
- [ ] **5.1.2** Run migration.

### 5.2 Rewrite Sync Endpoint

- [ ] **5.2.1** Create `lib/sync-engine.ts`:
  - [ ] `getChangesSince(deviceId, cursor, limit)` — returns changes + next cursor.
  - [ ] `detectConflicts(deviceId, pendingChanges)` — returns conflict list.
  - [ ] `applyClientChanges(deviceId, changes)` — validates and writes client changes.
- [ ] **5.2.2** Rewrite `GET /api/sync`:
  - [ ] Accept `?cursor=` and `?limit=` (default 50, max 200).
  - [ ] Use `DeviceSyncState` to track per-device progress.
  - [ ] Return shape:
    ```json
    {
      "changes": [...],
      "has_more": true,
      "next_cursor": "abc123",
      "synced_at": "2026-04-25T12:00:00Z",
      "conflicts": []
    }
    ```
- [ ] **5.2.3** Create `POST /api/sync`:
  - [ ] Accepts client changes (creates, updates, deletes since last sync).
  - [ ] Validates changes belong to user's workspace.
  - [ ] Detects conflicts (server modified after client's `last_sync_at`).
  - [ ] Applies non-conflicting changes.
  - [ ] Returns applied changes + conflicts for client resolution.

### 5.3 SyncLog Improvements

- [ ] **5.3.1** Add `device_id` population to all SyncLog writes (where available).
- [ ] **5.3.2** Add `change_checksum` to SyncLog for conflict detection.
- [ ] **5.3.3** Add index on `[workspace_id, changed_at, device_id]`.

### 5.4 Conflict Resolution Strategy

- [ ] **5.4.1** Document conflict resolution rules:
  - **Server wins** for changes to the same field.
  - Client receives `conflict: { server_value, client_value, field }`.
  - Client decides: keep server, keep local, or merge.
- [ ] **5.4.2** Add `POST /api/sync/resolve` endpoint for client to resolve conflicts explicitly.

**Phase 5 Gate:**
- [ ] Mobile device can sync 1000+ changes without timeouts.
- [ ] Simultaneous edit on mobile and web creates a detected conflict.
- [ ] Sync endpoint tested with multiple devices per user.

---

## 8. Phase 6: Content & Template Library

**Prerequisites:** Phase 4 (Collections) complete. Can run in parallel with Phase 5.

**Goal:** Replace the 5-item hardcoded template array with a real database table and seed PromptJar with high-quality content.

### 6.1 Template Database Table

- [ ] **6.1.1** Add `Template` model:
  ```prisma
  model Template {
    id            String   @id @default(cuid())
    name          String
    description   String?
    template_body String   @db.Text
    category_id   String?
    tags          Json?    @db.Json
    is_featured   Boolean  @default(false)
    usage_count   Int      @default(0)
    created_at    DateTime @default(now())
    updated_at    DateTime @updatedAt
  }
  ```
- [ ] **6.1.2** Run migration.
- [ ] **6.1.3** Update `GET /api/v1/templates` to query `Template` table instead of hardcoded array.
- [ ] **6.1.4** Update `GET /api/templates` (PRO endpoint) to also query the real table.
- [ ] **6.1.5** Deprecate the hardcoded `BUILTIN_TEMPLATES` array in `/api/templates/route.ts`.

### 6.2 Template Seeding

- [ ] **6.2.1** Create `prisma/seed-templates.ts` script.
- [ ] **6.2.2** Seed templates by category:
  - [ ] **Writing & Content** (10 templates): Blog post generator, email rewriter, headline generator, etc.
  - [ ] **Coding & Dev** (10 templates): Code reviewer, regex explainer, SQL generator, etc.
  - [ ] **Marketing** (10 templates): Ad copy, SEO meta description, cold outreach, etc.
  - [ ] **Productivity** (10 templates): Meeting summarizer, task prioritizer, etc.
  - [ ] **Creative** (10 templates): Story starter, image prompt generator, etc.
  - [ ] **Learning** (10 templates): Explain like I'm 5, flashcard generator, etc.
- [ ] **6.2.3** Each template must have `{variable}` placeholders extracted properly.
- [ ] **6.2.4** Run seed script in development.
- [ ] **6.2.5** Add `npm run db:seed:templates` to package.json scripts.

### 6.3 Template Curation & Admin

- [ ] **6.3.1** Add `is_featured` support to `GET /api/v1/templates` (featured templates appear first).
- [ ] **6.3.2** Create admin endpoint `POST /api/admin/templates` (owner only).
- [ ] **6.3.3** Create admin endpoint `PUT /api/admin/templates/:id`.
- [ ] **6.3.4** Create admin endpoint `DELETE /api/admin/templates/:id`.

**Phase 6 Gate:**
- [ ] 60+ templates seeded locally.
- [ ] Template library loads instantly with pagination.
- [ ] "Use template" flow creates a recipe in user's workspace.
- [ ] Admin can CRUD templates.

---

## 9. Phase 7: PromptJar Frontend (React Native MVP)

**Prerequisites:** Phase 5 (Sync) and Phase 6 (Templates) complete.

**Goal:** Build the "Pinterest for Prompts" mobile app MVP.

### 7.1 React Native Project Setup

- [ ] **7.1.1** Decision: Use Expo (`npx create-expo-app PromptJar --template blank-typescript`).
- [ ] **7.1.2** Configure `eas.json` for dev/qa/prod builds.
- [ ] **7.1.3** Install dependencies:
  - [ ] `expo-secure-store` (API key storage)
  - [ ] `expo-sqlite` (offline local storage)
  - [ ] `@react-navigation/native` + stack + bottom-tabs
  - [ ] `zustand` (state management)
  - [ ] `react-native-reanimated` + `react-native-gesture-handler`
  - [ ] `react-native-share` + `expo-sharing`
  - [ ] `react-native-vision-camera` (for OCR capture)
  - [ ] `@shopify/flash-list` (virtualized lists)
  - [ ] `axios` or `fetch` wrapper with JWT refresh.
- [ ] **7.1.4** Create folder structure:
  ```
  src/
    api/           // Axios instances, API wrapper functions
    components/    // Reusable UI components
    screens/       // Top-level screens
    navigation/    // Stack/tab navigators
    store/         // Zustand stores
    hooks/         // Custom React Native hooks
    lib/           // Utilities, constants, types
    sync/          // Offline-first sync engine
  ```

### 7.2 Offline-First Local Storage

- [ ] **7.2.1** Create `src/sync/database.ts` using `expo-sqlite`.
- [ ] **7.2.2** Create tables in SQLite:
  ```sql
  CREATE TABLE recipes (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    body TEXT,
    tags TEXT, -- JSON array
    category TEXT,
    is_favorited INTEGER,
    likes INTEGER,
    variables TEXT, -- JSON array
    created_at TEXT,
    updated_at TEXT,
    sync_status TEXT -- 'synced', 'pending_create', 'pending_update', 'pending_delete'
  );
  
  CREATE TABLE collections (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    recipe_count INTEGER,
    sync_status TEXT
  );
  
  CREATE TABLE collection_recipes (
    collection_id TEXT,
    recipe_id TEXT,
    PRIMARY KEY (collection_id, recipe_id)
  );
  
  CREATE TABLE templates (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    body TEXT,
    tags TEXT,
    category TEXT
  );
  
  CREATE TABLE sync_metadata (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  ```
- [ ] **7.2.3** Create CRUD helpers for each table.
- [ ] **7.2.4** Create `src/sync/engine.ts`:
  - [ ] `syncFromServer()` — pulls changes from `GET /api/sync`.
  - [ ] `pushToServer()` — pushes pending local changes to `POST /api/sync`.
  - [ ] `resolveConflicts()` — handles server conflicts.
  - [ ] `syncLoop()` — background sync every 30 seconds when online.

### 7.3 Auth Flow

- [ ] **7.3.1** Splash screen with logo.
- [ ] **7.3.2** Onboarding screen (3 slides: Save, Organize, Share).
- [ ] **7.3.3** Login screen (email/password + Google OAuth via Expo WebBrowser).
- [ ] **7.3.4** Token refresh logic in axios interceptor.
- [ ] **7.3.5** Store tokens in `expo-secure-store`.
- [ ] **7.3.6** `useAuth()` hook exposing `{ user, login, logout, isLoading }`.

### 7.4 Core Screens

**Screen 1: Home / Recipe Feed**
- [ ] **7.4.1** Top search bar with instant filtering.
- [ ] **7.4.2** Horizontal "Featured Collections" scroll.
- [ ] **7.4.3** Vertical recipe card list (image/icon + title + tags).
- [ ] **7.4.4** Floating Action Button (FAB) to add recipe.
- [ ] **7.4.5** Pull-to-refresh triggers sync.
- [ ] **7.4.6** Tab bar: Home, Search, Favorites, Collections, Settings.

**Screen 2: Add / Edit Recipe**
- [ ] **7.4.7** Title input.
- [ ] **7.4.8** Category dropdown (from local SQLite categories).
- [ ] **7.4.9** Body textarea with `{{variable}}` detection.
- [ ] **7.4.10** Tag chips with add/remove.
- [ ] **7.4.11** "📷 Scan" button (OCR from camera).
- [ ] **7.4.12** "📋 Paste" button (reads clipboard).
- [ ] **7.4.13** Save button writes to SQLite with `sync_status: 'pending_create'`, then triggers sync.

**Screen 3: Recipe Detail**
- [ ] **7.4.14** Full recipe body display.
- [ ] **7.4.15** Variable inputs detected from `{{variable}}` syntax.
- [ ] **7.4.16** "📋 Copy" button (copies filled body to clipboard).
- [ ] **7.4.17** "▶ Try" button (calls `POST /api/v1/recipes/:id/try`).
- [ ] **7.4.18** "⭐ Favorite" toggle.
- [ ] **7.4.19** "📤 Share" button (generates link via `POST /api/v1/recipes/:id/share`).
- [ ] **7.4.20** "➕ Add to Collection" bottom sheet.

**Screen 4: Collections**
- [ ] **7.4.21** Grid of collection cards.
- [ ] **7.4.22** "Create Collection" modal.
- [ ] **7.4.23** Collection detail screen (recipes inside).

**Screen 5: Try / Test Runner**
- [ ] **7.4.24** Variable form inputs.
- [ ] **7.4.25** "Run" button calls API.
- [ ] **7.4.26** Response display (scrollable).
- [ ] **7.4.27** "Copy Response" button.
- [ ] **7.4.28** "Retry" button.

**Screen 6: Settings**
- [ ] **7.4.29** Account info (email, logout).
- [ ] **7.4.30** Cloud sync status (last synced, sync now button).
- [ ] **7.4.31** Pro upgrade prompt (if free tier).
- [ ] **7.4.32** Theme toggle (light/dark).
- [ ] **7.4.33** "Open in Promptoria PRO" deep link (if installed).

### 7.5 Capture Integrations

- [ ] **7.5.1** **Share Extension:** Configure iOS Share Sheet and Android Intent so users can "Share to PromptJar" from ChatGPT, Safari, Twitter, etc.
  - [ ] Extract shared text and pre-fill Add Recipe screen.
- [ ] **7.5.2** **Clipboard Detection:** When app opens, check clipboard for prompt-like text. Ask "Save to PromptJar?"
- [ ] **7.5.3** **OCR:** Use react-native-vision-camera to scan physical paper/screens and extract text.

### 7.6 Deep Linking

- [ ] **7.6.1** Configure universal links (`https://promptoria.io/r/{share_token}`).
- [ ] **7.6.2** Opening a shared recipe link opens PromptJar directly to Recipe Detail.
- [ ] **7.6.3** If app not installed, fallback to web view.

**Phase 7 Gate:**
- [ ] app builds and runs on iOS simulator.
- [ ] app builds and runs on Android emulator.
- [ ] Can create recipe offline, close app, reopen, and it syncs when online.
- [ ] Can capture text from clipboard and save as recipe.
- [ ] Can generate share link and open it in browser (logged out view works).

---

## 10. Phase 8: PRO Web Polish & Feature Completion

**Prerequisites:** Phase 7 MVP complete. Can run in parallel.

### 8.1 Complete BACKLOG Tier 2 (Remaining Items)

- [ ] **8.1.1** Implement rate limiting on all API endpoints (100 req/min per user). *[Note: if done in Phase 1, skip]*
- [ ] **8.1.2** Implement rate limiting on test execution (10 req/min per user). *[Note: if done in Phase 1, skip]*
- [ ] **8.1.3** Add Sentry for runtime error tracking.
- [ ] **8.1.4** Add source maps for production debugging.
- [ ] **8.1.5** ~~Create `/privacy` page.~~ ** ALREADY SHIPPED.** Verify content is current; update if needed.
- [ ] **8.1.6** ~~Create `/terms` page.~~ ** ALREADY SHIPPED.** Verify content is current; update if needed.
- [ ] **8.1.7** Harden CORS (restrict origins in production).

### 8.2 Complete BACKLOG Tier 3

- [ ] **8.2.1** Prompt Templates Library UI in PRO (reuse Phase 6 table).
- [ ] **8.2.2** "Create from template" flow in PRO workspace.
- [ ] **8.2.3** A/B testing framework between prompt versions.
- [ ] **8.2.4** Statistical comparison of test results.
- [ ] **8.2.5** Batch testing with multiple variable sets.
- [ ] **8.2.6** Email integration (Resend/SendGrid for password reset, welcome email, email verification).

### 8.3 Performance

- [ ] **8.3.1** Add database indexes for common queries.
- [ ] **8.3.2** Add pagination to prompt/snippet/test-run lists (if not already present).
- [ ] **8.3.3** Optimize N+1 queries in API endpoints.
- [ ] **8.3.4** Add Redis caching layer (if needed at scale).

**Phase 8 Gate:**
- [ ] PRO dashboard loads < 500ms.
- [ ] All remaining BACKLOG Tier 2 and Tier 3 items complete.
- [ ] No console errors on PRO frontend.

---

## 11. Phase 9: Launch & Go-to-Market

### 9.1 Pre-Launch Checklist

- [ ] **9.1.1** Final QA on both PRO web and PromptJar mobile.
- [ ] **9.1.2** Production database migrations planned and tested.
- [ ] **9.1.3** Environment variables configured for production (Vercel for PRO, EAS for PromptJar).
- [ ] **9.1.4** SSL certificate and custom domain verified.
- [ ] **9.1.5** App Store Connect and Google Play Console accounts ready.
- [ ] **9.1.6** App icons, screenshots, and preview videos created.
- [ ] **9.1.7** App Store submission prepared (iOS).
- [ ] **9.1.8** Google Play submission prepared (Android).

### 9.2 Product Hunt Launch

- [ ] **9.2.1** Create Product Hunt GIFs and screenshots for PromptJar.
- [ ] **9.2.2** Write Product Hunt tagline: "Your personal recipe book for AI prompts."
- [ ] **9.2.3** Prepare maker comment responding to feedback.
- [ ] **9.2.4** Schedule launch for Tuesday 12:01 AM PT.
- [ ] **9.2.5** Notify network (Twitter, LinkedIn, Reddit r/ChatGPTPrompts).

### 9.3 Post-Launch Monitoring

- [ ] **9.3.1** Monitor Sentry for mobile crashes.
- [ ] **9.3.2** Monitor Vercel logs for API errors.
- [ ] **9.3.3** Monitor sync failures via SyncLog error patterns.
- [ ] **9.3.4** Respond to App Store / Play Store reviews within 24 hours.

**Phase 9 Gate:**
- [ ] App is live on App Store and/or Google Play.
- [ ] PRO web is stable in production.
- [ ] First 100 users have signed up for PromptJar.

---

## 12. Appendix: API Contract Reference

### Public Endpoints (No Auth)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/v1/public/recipes/:share_token` | View shared recipe |

### Authentication Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register (optional `client_type`) |
| `POST` | `/api/auth/login` | Login (optional `client_type`) |
| `POST` | `/api/auth/refresh` | Refresh token |
| `POST` | `/api/auth/forgot-password` | Reset request |
| `POST` | `/api/auth/reset-password` | Reset execution |
| `GET` | `/api/auth/google` | OAuth redirect |
| `GET` | `/api/auth/google/callback` | OAuth callback |

### PRO Endpoints (Auth Required)

| Method | Path | Description |
|---|---|---|
| `GET/POST` | `/api/prompts` | Full CRUD with versions |
| `GET/PUT/DELETE` | `/api/prompts/:id` | Single prompt + versions |
| `POST` | `/api/prompts/:id/clone` | Fork prompt |
| `POST` | `/api/prompts/:id/rollback` | Rollback version |
| `POST` | `/api/prompts/:id/compositions` | Snippet composition |
| `GET` | `/api/prompts/:id/versions/compare` | Diff two versions |
| `POST/DELETE/GET` | `/api/prompts/:id/favorite` | Favorites (already shipped) |
| `GET` | `/api/test-runs` | Test history (already shipped) |
| `GET/POST` | `/api/snippets` | Snippet CRUD |
| `GET/POST` | `/api/categories` | Categories |
| `GET` | `/api/search` | Cross-entity search |
| ... | ... | ... |

### Consumer v1 Endpoints (Auth Required, Client Type `PromptJar`)

| Method | Path | Description |
|---|---|---|
| `GET/POST` | `/api/v1/recipes` | Simplified prompt CRUD |
| `GET/PUT/DELETE` | `/api/v1/recipes/:id` | Single recipe |
| `POST` | `/api/v1/recipes/:id/favorite` | Toggle favorite |
| `POST` | `/api/v1/recipes/:id/try` | One-shot execution |
| `POST` | `/api/v1/recipes/:id/share` | Generate share link |
| `GET` | `/api/v1/categories` | Flat categories |
| `GET/POST` | `/api/v1/collections` | Collections CRUD |
| `POST/DELETE` | `/api/v1/collections/:id/recipes` | Add/remove recipe from collection |
| `GET` | `/api/v1/templates` | Curated templates |
| `POST` | `/api/v1/templates/:id/use` | Clone template to recipe |
| `GET` | `/api/v1/search?q=` | Full-text search |
| `GET/POST` | `/api/sync` | Device sync |

---

## 13. Appendix: Database Migration Log

Use this table to track every Prisma migration as you work.

| # | Migration Name | Description | Date Applied | Branch |
|---|---|---|---|---|
| | | | | |

---

## Quick Reference: How to Mark Progress

When completing a task:

```markdown
- [x] Task completed
```

When completing a phase:

```markdown
**Phase X Gate:**
- [x] Gate condition met
```

When adding a new migration row:

```markdown
| 1 | add_visibility_and_sharing | Added Visibility enum, likes, and PromptShare | 2026-04-25 | dual-product |
```

---

## Document Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-25 | Initial draft |
| 1.1 | 2026-04-25 | **Revised after code audit.** Removed 1.1–1.4 (History, Favorites, Tags, Empty States) as already shipped. Added "Backlog vs. Reality" callout. Removed 8.1.5/8.1.6 (Privacy/Terms) as already shipped. Updated Phase 1 title and scope. |

---

*End of Implementation Plan*
