# Agent Guidelines

Instructions for AI agents (Cursor, Copilot, opencode, etc.) working on this codebase.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS + CSS custom properties (no component library)
- **Auth**: Custom JWT (see `lib/jwt.ts`)
- **AI Providers**: Ollama (local), Anthropic Claude (API)

## Commands

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run lint         # Run ESLint
npm test             # Run Jest tests
npx prisma db push   # Push schema changes to database
npx prisma db seed   # Seed example data
npx prisma studio    # Visual database browser
```

## Project Structure

- `app/api/` — API route handlers (Next.js App Router pattern)
- `app/<page>/` — Page components (all `'use client'`)
- `components/` — Shared UI components
- `lib/` — Utilities: `jwt.ts`, `prisma.ts`, `api-config.ts`, `themes.ts`
- `prisma/schema.prisma` — Database models
- `middleware.ts` — Route protection

## Coding Conventions

### API Routes

Every protected route follows this pattern:
```typescript
import { verifyAccessToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({ where: { user_id: userId } })
}

export async function GET(request: NextRequest) {
  // 1. Auth check
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.substring(7)
  let userId: string
  try {
    const decoded = verifyAccessToken(token)
    userId = decoded.userId
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get workspace (every query must be scoped)
  const workspace = await getWorkspaceForUser(userId)
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  // 3. Business logic scoped to workspace.id
  // ...

  // 4. Log mutations to SyncLog
  await prisma.syncLog.create({
    data: {
      workspace_id: workspace.id,
      action: 'create',
      entity_type: 'prompt',
      entity_id: result.id,
      data: { /* relevant data */ },
    },
  })

  return NextResponse.json(result, { status: 201 })
}
```

### Frontend Pages

All pages use `'use client'` and follow this pattern:
```typescript
'use client'
import { useAuth } from '@/app/providers'
import { API_ENDPOINTS } from '@/lib/api-config'

export default function MyPage() {
  const { user } = useAuth()
  // Fetch data with useEffect, auth token from localStorage
  // Render UI with inline styles (CSS custom properties)
}
```

### Styling

- Use CSS custom properties (`var(--color-accent)`, `var(--color-background)`, etc.)
- No component library — use plain HTML elements with inline styles
- Theme definitions live in `lib/themes.ts`
- Cards use `className="card"`

### Error Handling

- API routes return `{ error: "message" }` with appropriate HTTP status codes
- Frontend uses `try/catch` with `useState` for error display
- Use `console.error` for logging, never expose internal errors to users

### Database

- Always scope queries to `workspace_id` for data isolation
- Use `prisma.model.findFirst({ where: { id, workspace_id: workspace.id } })` not `findUnique`
- Log all mutations to `SyncLog` for audit trail
- Never expose `workspace_id` or `user_id` in API responses

### Adding New Features

1. Add model to `prisma/schema.prisma` if needed
2. Run `npx prisma db push` to update the database
3. Create API route in `app/api/<feature>/route.ts`
4. Add endpoint URL to `lib/api-config.ts`
5. Create or update page in `app/<feature>/page.tsx`
6. Add navigation link in sidebar (if applicable)
7. Update `FEATURES.md` and `BACKLOG.md`

### Testing

- Use Jest for unit tests
- Test files go in `__tests__/` directory
- Run `npm test` before committing

## Key Architectural Decisions

1. **Single deployment** — Frontend and API are one Next.js app
2. **No component library** — Plain HTML + CSS custom properties + inline styles
3. **JWT auth** — Custom implementation, tokens in localStorage
4. **Workspace isolation** — All data scoped to user's workspace
5. **Immutable versions** — Editing creates new PromptVersion records
6. **Composition model** — Snippets linked to versions via PromptComposition with rank
7. **SyncLog audit trail** — Every mutation is logged