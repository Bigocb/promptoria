# Promptoria Architecture

## Overview

Promptoria is a single-process Next.js 14 application using the App Router pattern. The frontend and API share the same codebase and deployment.

```
┌─────────────────────────────────────────┐
│                Vercel                    │
│                                         │
│  ┌──────────┐    ┌──────────────────┐  │
│  │  Next.js  │    │  API Routes       │  │
│  │  Pages    │◄──►│  (app/api/*)      │  │
│  │  (SSR)    │    │                    │  │
│  └──────────┘    └────────┬───────────┘  │
│                           │              │
│                    ┌──────▼──────┐       │
│                    │  Prisma ORM  │       │
│                    └──────┬──────┘       │
│                           │              │
└───────────────────────────┼──────────────┘
                            │
                    ┌───────▼───────┐
                    │  PostgreSQL    │
                    └───────────────┘

    External APIs:
    ┌───────────┐  ┌───────────┐
    │  Ollama    │  │  Anthropic │
    │  (local)   │  │  Claude    │
    └───────────┘  └───────────┘
```

## Data Model

```
User ──1:1──► UserSettings
  │
  └──1:1──► Workspace
              │
              ├──1:N──► Prompt
              │         │
              │         ├──1:N──► PromptVersion
              │         │           │
              │         │           ├──1:N──► PromptComposition ──N:1──► Snippet
              │         │           │
              │         │           └──1:N──► TestRun
              │         │
              │         └──N:1──► PromptCategory
              │
              ├──1:N──► Snippet
              │
              ├──1:N──► AgentInteractionType
              │           │
              │           └──1:N──► PromptCategory
              │
              └──1:N──► SyncLog
```

### Key Design Decisions

**Immutable Versions** — `PromptVersion` records are never modified. Editing a prompt creates a new version with an incremented version number. This preserves the full history and enables diff comparison and rollback.

**Composition Model** — A `PromptVersion` links to `Snippet`s through the `PromptComposition` join table, which includes a `rank` field for ordering. This allows the same snippet to be reused across many prompts.

**Workspace Isolation** — Every query is scoped to the authenticated user's workspace. The `getWorkspaceForUser()` helper is used in every API route to enforce data isolation.

**SyncLog** — All mutations are logged to `SyncLog` with action type, entity type, and entity ID. This enables activity feeds, audit trails, and future offline-sync capabilities.

## Authentication Flow

```
Client                           Server
  │                                │
  │  POST /auth/signup             │
  │  { email, password }           │
  │──────────────────────────────►│
  │                                │  Create User + Workspace
  │  { accessToken, refreshToken }│
  │◄──────────────────────────────│
  │                                │
  │  POST /auth/login              │
  │  { email, password }           │
  │──────────────────────────────►│
  │                                │  Verify credentials
  │  { accessToken, refreshToken }│
  │◄──────────────────────────────│
  │                                │
  │  GET /api/prompts              │
  │  Authorization: Bearer <jwt>  │
  │──────────────────────────────►│
  │                                │  verifyAccessToken() → userId
  │  { prompts[] }                │  getWorkspaceForUser(userId)
  │◄──────────────────────────────│
```

- Access tokens expire after 24 hours (configurable in `lib/jwt.ts`)
- Tokens are stored in `localStorage` on the client
- No refresh token rotation is implemented yet

## API Design Patterns

All protected API routes follow a consistent pattern:

1. **Extract and verify JWT** from `Authorization: Bearer <token>` header
2. **Resolve workspace** via `getWorkspaceForUser(userId)`
3. **Scope all queries** to `workspace_id`
4. **Log mutations** to `SyncLog`
5. **Return JSON** with appropriate HTTP status code

Error responses always follow: `{ "error": "descriptive message" }`

## Frontend Architecture

```
app/
├── layout.tsx          # Root layout with providers (auth, settings, theme)
├── providers.tsx       # React context providers
├── page.tsx            # Landing page (redirects to dashboard)
├── auth/              # Login, signup, refresh pages
├── dashboard/         # Main dashboard with stats
├── prompts/[id]/      # Prompt detail + composition workbench
├── library/           # Browse by interaction type + category
├── snippets/          # Snippet CRUD management
├── history/           # Version history viewer
├── test/              # Test runner
└── settings/          # Theme, model, API key config
```

- Uses `'use client'` directive for all interactive pages
- State managed with React `useState`/`useEffect`
- API calls use `fetch()` with JWT from `localStorage`
- Endpoints centralized in `lib/api-config.ts`
- Theme system uses CSS variables defined in `lib/themes.ts`

## AI Provider Integration

### Ollama (Local, Free)
- Connects to `http://localhost:11434/api/generate`
- Supports Llama 2, Mistral, Neural Chat
- No API key required
- Used when model ID starts with `llama`, `mistral`, or `neural-chat`

### Anthropic Claude (Paid)
- Uses `@anthropic-ai/sdk` npm package
- Requires `ANTHROPIC_API_KEY` in env or user settings
- Supports Claude Opus, Sonnet, Haiku models
- Returns token counts via `message.usage`

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema definition |
| `lib/jwt.ts` | JWT signing and verification |
| `lib/prisma.ts` | Prisma client singleton |
| `lib/api-config.ts` | Centralized API endpoint URLs |
| `lib/themes.ts` | Theme definitions (6 themes) |
| `middleware.ts` | Route protection middleware |
| `app/providers.tsx` | Auth, settings, and theme context providers |