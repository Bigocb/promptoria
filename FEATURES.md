# Promptoria Features

## Completed

### Core Infrastructure
- [x] Next.js 14 with App Router
- [x] PostgreSQL + Prisma ORM
- [x] TypeScript
- [x] CSS custom properties theme system with Gruvbox Dark, Gruvbox Light, Solarized Dark, Monokai, Custom Dark
- [x] JWT authentication (signup, login, refresh tokens)
- [x] Google OAuth sign-up/login with account linking
- [x] Password reset flow (forgot password / reset password)
- [x] Rate limiting on auth endpoints (10 requests / 15 min per IP)
- [x] Workspace isolation per user
- [x] Activity/audit logging (SyncLog)
- [x] Admin dashboard (owner-only metrics)

### Theme System
- [x] Gruvbox Dark (default), Gruvbox Light, Solarized Dark, Monokai, Custom Dark
- [x] CSS variable-based theming with localStorage persistence
- [x] Sidebar navigation

### Prompt Management
- [x] Prompt CRUD API + UI
- [x] Version history with immutable versions (editing creates new version)
- [x] Diff viewer and version comparison UI
- [x] Version rollback API
- [x] Prompt composition (snippet picker, insert, reorder, remove)
- [x] Compositions API (GET, POST, PUT for snippet ordering)
- [x] Variable substitution (`{{variable_name}}`)
- [x] Prompt cloning/forking
- [x] Prompt validation API
- [x] Tag suggestions API
- [x] Search across prompts, snippets, and categories
- [x] Category system with AgentInteractionType hierarchy
- [x] Library page (browse by interaction type and category)

### Snippet Library
- [x] Snippet CRUD (create, read, update, delete)
- [x] Snippet card grid UI
- [x] Snippet comparison API
- [x] Snippet insertion into prompts via composition

### Test Runner
- [x] Ollama Cloud integration (server-side API key)
- [x] Multiple model support
- [x] Model selection UI with family filtering
- [x] Variable extraction and test case input
- [x] Run statistics (latency, token count, duration)
- [x] Test history persistence (Prisma)
- [x] Batch prompt execution
- [x] Single test run execution and re-execution

### Data Management
- [x] Export (JSON and CSV formats)
- [x] Import (prompts, snippets, categories, interaction types)
- [x] Batch operations (delete/update multiple entities)
- [x] Search API (cross-entity: prompts, snippets, categories)

### AI-Powered Features
- [x] AI prompt suggestions (Ollama Cloud-powered analysis and recommendations)
- [x] AI tag suggestions
- [x] Model presets API

### Analytics & Monitoring
- [x] Usage analytics API (per-prompt test run stats, success rates)
- [x] Quota/usage tracking API (daily/weekly/monthly, token estimation)
- [x] Activity log with filtering, grouping, and pagination

### Settings & Configuration
- [x] Default model and temperature settings
- [x] Ollama Cloud status detection
- [x] Theme switching
- [x] Suggestion toggle

## Partially Implemented

- [~] Favorites — API stub exists (POST/DELETE `/prompts/[id]/favorite`) but only logs to SyncLog, no persistence model
- [~] History page — UI renders but uses hardcoded mock data instead of `/api/test-runs`
- [~] Cost calculation — Model pricing data exists in `/api/models` but test results don't compute cost
- [~] Tag suggestions — API exists but no UI surface for it

## Not Yet Started

See `BACKLOG.md` for the full prioritized list.