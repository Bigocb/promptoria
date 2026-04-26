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

### Model Tiering (v1)
- `ModelPreset` table: tier_required, is_active, cost_estimate, sort_order
- 12 curated Ollama models seeded (4 free, 5 pro, 3 BYOK)
- `GET /api/models` filters by user's subscription_tier
- `GET/PUT /api/admin/models/*` endpoints for admin config
- Admin model config UI at `/admin/models`
- Workbench model field converted to tiered dropdown
- Test runner already respects tier via backend filter

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
- AI-powered prompt improvement suggestions
- Prompt performance analytics (which versions perform best)
- A/B test framework (compare two prompt versions statistically)
- Auto-tagging from prompt content

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
