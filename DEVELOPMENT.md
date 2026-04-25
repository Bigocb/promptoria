# Promptoria - Development Guide

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your database URL and optional API keys:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/promptarchitect"
   JWT_SECRET="your-secret-key"
   ANTHROPIC_API_KEY="sk-ant-..."  # Optional, for Claude integration
   ```

3. **Setup database**
   ```bash
   npm run db:push    # Push schema to database
   npm run db:seed    # Seed example data (optional)
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS + CSS variables
- **Auth**: JWT (custom implementation in `lib/jwt.ts`)
- **AI Providers**: Ollama (local), Anthropic Claude (API)

## Project Structure

```
app/
├── api/                        # API route handlers
│   ├── auth/                   # Signup, login, refresh
│   ├── prompts/                # Prompt CRUD, versions, compositions, etc.
│   ├── snippets/               # Snippet CRUD, compare
│   ├── categories/             # Interaction types and categories
│   ├── test-runs/              # Test execution and history
│   ├── models/                 # Available AI models
│   ├── analytics/              # Usage analytics
│   ├── activity/               # Audit log
│   ├── workspaces/             # Workspace management
│   ├── search/                 # Cross-entity search
│   ├── export/ / import/       # Data portability
│   ├── batch/                  # Batch operations
│   └── settings/               # User settings, API keys
├── auth/                       # Login, signup pages
├── dashboard/                  # Dashboard page
├── prompts/[id]/               # Prompt detail / workbench
├── snippets/                  # Snippet library page
├── library/                   # Prompt library page
├── history/                   # Version history page
├── test/                      # Test runner page
└── settings/                  # Settings page

lib/
├── api-config.ts              # API endpoint constants
├── jwt.ts                     # JWT authentication utilities
├── prisma.ts                  # Prisma client singleton
└── themes.ts                  # Theme definitions

prisma/
├── schema.prisma              # Database schema
└── seed.ts                    # Seed data
```

## Database

### Migrations

```bash
# Push schema changes (development)
npx prisma db push

# Create a proper migration
npx prisma migrate dev --name description

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed with example data
npx prisma db seed
```

### Schema Changes

Edit `prisma/schema.prisma`, then run:
```bash
npx prisma db push
# or
npx prisma migrate dev --name your-change-description
```

## API Development

All API routes are in `app/api/`. Each route file exports standard Next.js route handlers:

```typescript
// app/api/prompts/route.ts
export async function GET(request: NextRequest) { ... }
export async function POST(request: NextRequest) { ... }
```

### Authentication

All protected routes verify JWT tokens:
```typescript
const authHeader = request.headers.get('Authorization')
const token = authHeader.substring(7)
const decoded = verifyAccessToken(token)
const userId = decoded.userId
```

### Adding a New API Endpoint

1. Create `app/api/your-endpoint/route.ts`
2. Export `GET`, `POST`, `PUT`, or `DELETE` handlers
3. Add auth verification at the start of each handler
4. Add the endpoint URL to `lib/api-config.ts`

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- path/to/test.test.ts
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create and run migration |
| `npm run db:seed` | Seed database with example data |
| `npm test` | Run tests |

## Troubleshooting

### Database connection error
```bash
# Create the database
createdb promptarchitect
npx prisma db push
```

### Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### API key error
Set `ANTHROPIC_API_KEY` in `.env.local` for Claude integration, or use Ollama for local models.