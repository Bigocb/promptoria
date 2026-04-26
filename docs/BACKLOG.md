# Promptoria Backlog

**Last Updated:** April 25, 2026

---

## ✅ Recently Shipped (April 2026)

### Auth & Infrastructure
- Google OAuth (custom flow, not NextAuth)
- JWT refresh tokens (24h expiry + auto-refresh)
- Password reset (token-based, dev-only email)
- Rate limiting (10 req / 15 min per IP on auth routes)
- Admin dashboard with signup/prompt stats and model usage charts

### Favorites System
- Favorite/unfavorite prompts (workbench star toggle)
- `GET /api/favorites` list endpoint
- Favorites filter on library page
- Favorited prompts show star in lists

### Model Tiering (v2)
- `admin` tier added above `enterprise` — highest access, grants admin panel
- `subscription_tier` now embedded in JWT payload so API routes can read it without DB lookup
- `lib/is-admin.ts` helper — checks `tier === 'admin'` OR legacy `ADMIN_EMAIL` match
- `GET /api/models` reads tier from JWT directly (no DB round-trip)
- 12 curated Ollama models seeded (4 free, 5 pro, 3 BYOK)

### UI/UX Fixes
- Bottom nav padding fix (mobile content no longer covered)
- Test runner now respects saved model and max_tokens
- Dead `/prompts/[id]` detail page removed (all flow goes through workbench)

---

## 🚧 In Progress / Near Term

### Tiering & Monetization

| Item | Priority | Notes |
|------|----------|-------|
| Daily test-run token limits for free tier | High | Track `user.daily_tokens_used` / `daily_tokens_limit`, reset at UTC midnight |
| Stripe subscription integration (Pro tier) | High | Need Stripe checkout + webhook to upgrade `user.subscription_tier` |
| BYOK integration (Claude/OpenAI with user keys) | Medium | `user_settings.claude_api_key`, `openai_api_key`; use user key, not ours |
| Tier display on settings / account page | Medium | Show current tier, usage stats, upgrade CTA |

### Core Product

| Item | Priority | Notes |
|------|----------|-------|
| Prompt templates library | High | Pre-built prompts new users can clone |
| Export prompts (Markdown / JSON / copy) | High | Single prompt + batch export |
| Prompt cloning/forking in UI | Medium | "Duplicate" button on workbench |
| Variable set improvements | Medium | Inline editing, collision detection, preset values |
| Category management in workbench | Medium | Create new categories inline while saving |
| Prompt search in workbench dropdown | Medium | Typeahead search for loaded prompt selector |

### Test Runner Enhancements

| Item | Priority | Notes |
|------|----------|-------|
| Persist test results per prompt (not just in-memory) | High | `test_runs` table exists, now show history per prompt |
| Store user-selected model/max_tokens per test run | High | Currently sends from UI but not persisted well |
| Response comparison (A/B two test runs) | Medium | Side-by-side output viewer |
| Test batching / multiple variable sets | Medium | Run same prompt across multiple variable combos |

---

## 🔮 Later / Strategic

### Collaboration (Team Tier)
- Shared workspaces (invite by email)
- Role-based access (viewer, editor, admin)
- Activity log per workspace
- Comments on prompt versions
- Real-time collaborative editing (Yjs or similar)

### Mobile
- React Native app (re-use API, offline-first with sync)
- Mobile-optimized workbench (already responsive but native is better)
- Push notifications

### Advanced AI Features
- **AI-powered prompt improvement suggestions**
- **Prompt performance analytics** (which versions perform best)
- **A/B Test Workbench** (see detailed notes below)
- **Auto-tagging** from prompt content

#### A/B Test Workbench — Detailed Design Notes
Vision: A dedicated testing environment where users can compare prompt versions side-by-side, not just view raw outputs but understand *which performed better*.

Key concepts:
- **Version A vs Version B**: Load two prompt versions (or tweak the same version with different variables) into a split pane.
- **AI Judge**: Ask a model to evaluate which output was more effective against criteria: clarity, completeness, tone accuracy, factual correctness, etc.
- **Criteria scoring**: Each test gets a rubric (1-5 across dimensions). AI fills the rubric, user can override.
- **Session persistence**: Test configurations + results stored per prompt, visible across sessions.
- **Winner badge**: Prompt version that wins most A/B rounds gets a "most effective" marker.
- **History timeline**: See all past tests for a prompt, filter by date, model used, winner.

Why this matters:
- Moves Promptoria from "prompt storage" to "prompt optimization"
- Helps users iterate based on evidence, not gut feeling
- Differentiator feature: most prompt tools don't offer systematic comparison

Technical considerations:
- Need to store `test_sessions` table linking two `test_run` rows
- AI judge needs system prompt with evaluation rubric
- Could be gated to Pro/Enterprise tier (compute intensive)
- Could integrate with actual downstream task metrics if user connects eval dataset

### Platform Integrations
- Zapier / Make.com webhook endpoints
- Plugin system for custom model providers
- Slack/Discord bot for sharing prompts
- Notion/Confluence export

---

## 🐛 Known Bugs / Tech Debt

1. **Test runner API mock** — `ollamaResponse.text is not a function` in `test-runs.test.ts` (non-blocking, test-only)
2. **Google OAuth consent screen** — still in "Testing" mode in Google Cloud Console, needs publishing + privacy policy review
3. **Vercel `request.url`** — internal URLs on Vercel; must continue using `NEXT_PUBLIC_APP_URL` for all redirect URLs
4. **Google OAuth `id` field** — Google's `/v2/userinfo` returns `id` not `sub`; confirmed fixed but worth documenting
5. **Prisma `@@map` casing drift** — after schema changes always run `db push` + `generate` before commit
6. **Bottom nav padding** — CSS fix in place; retest on Safari iOS which may have different safe-area behavior
7. **Model dropdown fallback** — if saved prompt model is no longer in user's tier, silently falls back to first available. Should we warn?

---

## 📊 Current Architecture

```
User ──1:1──► UserSettings (anthropic_api_key, default_model, theme)
  │
  └──1:1──► Workspace
              │
              ├──1:N──► Prompt
              │         │
              │         ├──1:N──► PromptVersion
              │         │           ├──1:N──► PromptComposition ──N:1──► Snippet
              │         │           └──1:N──► TestRun
              │         └──N:1──► PromptCategory
              │
              ├──1:N──► Snippet
              ├──1:N──► AgentInteractionType
              ├──1:N──► TestRun (via workspace_id)
              └──1:N──► SyncLog

ModelPreset (global, not per workspace)
Favorite ──N:1──► Prompt
Favorite ──N:1──► User
OAuthAccount ──N:1──► User
Device ──N:1──► User
```

---

## 🗓 Suggested Sprint Order

**Sprint 1 (Now)**
1. Daily token quota gating + usage display
2. Test result persistence + per-prompt history
3. Prompt export (copy to clipboard as minimum)

**Sprint 2**
1. Stripe checkout for Pro tier
2. BYOK key storage + use in test runner
3. Prompt templates library (5-10 starters)

**Sprint 3**
1. Team sharing (shared workspace invites)
2. Mobile web PWA manifest
3. AI prompt suggestions (use existing suggestion API)
