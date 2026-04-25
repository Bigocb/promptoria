# Promptoria

A **modular, versioned prompt management system** for building, testing, and deploying LLM prompts at scale.

## Features

- **Snippet Library** — Create, edit, and organize reusable text blocks
- **Prompt Workspace** — Compose prompts from snippets with composition tracking
- **Version History** — Immutable versions with diff viewer and rollback
- **Test Runner** — Execute prompts with Ollama (local/free) or Claude (paid)
- **Variable Substitution** — Dynamic `{{variable_name}}` support
- **AI Suggestions** — Claude-powered prompt improvement recommendations
- **Search** — Cross-entity search across prompts, snippets, and categories
- **Export/Import** — JSON and CSV export, full data import
- **Analytics** — Usage stats, quota tracking, activity logs
- **Library** — Browse prompts by interaction type and category

See [FEATURES.md](./FEATURES.md) for the complete feature list and [BACKLOG.md](./BACKLOG.md) for remaining work.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS
- **AI Providers**: Ollama (local), Anthropic Claude (API)

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and ANTHROPIC_API_KEY

# Setup database
npm run db:push    # Push schema
npm run db:seed    # Seed example data (optional)

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
promptarchitect/
├── app/
│   ├── api/                    # API routes (see API_REFERENCE.md)
│   ├── auth/                    # Login, signup, refresh
│   ├── dashboard/               # Dashboard UI
│   ├── history/                  # Version history UI
│   ├── library/                  # Prompt library UI
│   ├── prompts/[id]/             # Prompt detail / workbench UI
│   ├── settings/                 # Settings UI
│   └── snippets/                 # Snippet library UI
├── components/                   # Shared UI components
├── lib/                          # Utilities, config, JWT, themes
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                   # Seed data
└── docs/
    ├── ARCHITECTURE.md           # System architecture
    ├── API_REFERENCE.md          # Full API docs
    └── archive/                  # Historical phase docs
```

## Documentation

| File | Description |
|------|-------------|
| [FEATURES.md](./FEATURES.md) | Complete feature status (completed, partial, planned) |
| [BACKLOG.md](./BACKLOG.md) | Prioritized remaining work |
| [API_REFERENCE.md](./API_REFERENCE.md) | Full API endpoint documentation |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guide |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Developer setup guide |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture & data model |

## License

MIT