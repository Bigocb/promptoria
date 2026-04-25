# File Manifest

Generated: 2026-04-22

## Core Application Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Next.js middleware for route protection |
| `next.config.js` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `tsconfig.json` | TypeScript configuration |
| `package.json` | Project dependencies and scripts |
| `jest.config.js` | Jest test configuration |
| `jest.setup.js` | Jest setup |
| `docker-compose.yml` | Docker compose for PostgreSQL |
| `Dockerfile` | Docker build configuration |

## Library (`lib/`)

| File | Purpose |
|------|---------|
| `lib/api-config.ts` | Centralized API endpoint URL constants |
| `lib/auth.ts` | Auth utility functions |
| `lib/jwt.ts` | JWT token signing and verification |
| `lib/prisma.ts` | Prisma client singleton (prevents hot-reload issues) |
| `lib/themes.ts` | Six theme definitions with CSS custom properties |
| `lib/utils.ts` | General utility functions |

## Components (`components/`)

| File | Purpose |
|------|---------|
| `components/Sidebar.tsx` | Desktop sidebar navigation |
| `components/SidebarWrapper.tsx` | Sidebar wrapper with auth guard |
| `components/BottomNav.tsx` | Mobile bottom navigation |
| `components/ProtectedRoute.tsx` | Auth guard wrapper component |
| `components/ui/button.tsx` | Button component |
| `components/ui/card.tsx` | Card component |
| `components/ui/input.tsx` | Input component |
| `components/ui/label.tsx` | Label component |
| `components/ui/textarea.tsx` | Textarea component |

## Pages (`app/`)

| File | Purpose |
|------|---------|
| `app/page.tsx` | Landing/home page (redirects to dashboard) |
| `app/layout.tsx` | Root layout with providers |
| `app/providers.tsx` | React context providers (auth, settings, theme) |
| `app/globals.css` | Global styles and CSS variables |
| `app/error.tsx` | Error boundary |
| `app/dashboard/page.tsx` | Main dashboard with stats |
| `app/prompts/[id]/page.tsx` | Prompt detail/workbench page |
| `app/library/page.tsx` | Prompt library (browse by category) |
| `app/snippets/page.tsx` | Snippet library CRUD |
| `app/history/page.tsx` | Version history viewer |
| `app/test/page.tsx` | Test runner |
| `app/settings/page.tsx` | Settings (theme, model, API keys) |
| `app/auth/login/page.tsx` | Login page |
| `app/auth/signup/page.tsx` | Signup page |
| `app/landing/page.tsx` | Public landing page |

## API Routes (`app/api/`)

| Directory | Endpoints | Purpose |
|-----------|-----------|---------|
| `auth/` | POST signup, login, refresh | JWT authentication |
| `prompts/` | CRUD + clone, favorite, rollback, compositions, suggestions, validate, execute-batch, tags-suggestions, versions/compare | Full prompt management |
| `snippets/` | CRUD + compare | Snippet management |
| `categories/` | CRUD for interaction types + categories | Library organization |
| `test-runs/` | GET, POST, execute | Test execution with Ollama/Claude |
| `models/` | GET | Available AI models with pricing |
| `model-presets/` | GET, POST | Saved model configurations |
| `search/` | GET q, type | Cross-entity search |
| `export/` | GET format, type | Export workspace data |
| `import/` | POST | Import workspace data |
| `batch/operations/` | POST | Bulk delete/update |
| `analytics/usage/` | GET | Per-prompt analytics |
| `quotas/usage/` | GET | Usage quotas and limits |
| `activity/` | GET | Audit log with filtering |
| `workspaces/` | GET, PUT | Workspace management |
| `dashboard/stats/` | GET | Dashboard overview |
| `settings/api-keys/` | GET, PUT, DELETE | API key management |
| `user/` | GET profile, settings; PUT settings | User settings |
| `health/` | GET | Health check |
| `sync/` | GET timestamp | Offline-first sync |
| `sync-logs/` | GET, DELETE | Change log |
| `maintenance/cleanup/` | POST | Database cleanup |
| `notes/` | GET, POST | Resource annotations |
| `templates/` | GET, POST | Prompt templates |
| `devices/` | GET, POST | Device management |
| `stats/comprehensive/` | GET | Comprehensive workspace stats |
| `docs/endpoints/` | GET | API endpoint discovery |

## Database (`prisma/`)

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database models (User, Workspace, Prompt, PromptVersion, PromptComposition, Snippet, TestRun, etc.) |
| `prisma/seed.ts.disabled` | Seed data (currently disabled) |

## Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview and quickstart |
| `FEATURES.md` | Complete feature status (completed, partial, planned) |
| `BACKLOG.md` | Prioritized remaining work |
| `API_REFERENCE.md` | Full API endpoint documentation |
| `DEPLOYMENT.md` | Deployment guide (Vercel + PostgreSQL) |
| `DEVELOPMENT.md` | Developer setup and development guide |
| `docs/ARCHITECTURE.md` | System architecture, data model, auth flow |
| `docs/AGENT_GUIDELINES.md` | Instructions for AI agents working on the codebase |
| `docs/archive/` | Historical phase documentation |