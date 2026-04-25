# Deployment Guide

## Architecture

Promptoria is a single Next.js application deployed to Vercel:

```
GitHub Repo (main branch)
    ↓
    └→ Vercel (Next.js — frontend + API routes)
       https://promptoria.vercel.app
```

The app uses Next.js API routes for the backend, with PostgreSQL as the database.

## Prerequisites

- Vercel account
- PostgreSQL database (Vercel Postgres, Supabase, Neon, or similar)
- Anthropic API key (optional, for Claude integration)
- Ollama running locally or remotely (optional, for local model support)

## Vercel Deployment

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Import Project" and select your GitHub repo
3. Framework: **Next.js**
4. Configure environment variables:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   JWT_SECRET=your-secret-key
   ANTHROPIC_API_KEY=sk-ant-... (optional)
   ```
5. Click "Deploy"

## Database Setup

### Using Vercel Postgres

1. In Vercel dashboard, go to Storage → Create Database
2. Select Postgres and create
3. The `DATABASE_URL` will be automatically set

### Using External PostgreSQL

1. Create a PostgreSQL database (Supabase, Neon, Railway, etc.)
2. Add the `DATABASE_URL` to Vercel environment variables
3. Run migrations:
   ```bash
   npx prisma db push
   ```

### Seed Data (Optional)

```bash
npx prisma db seed
```

## Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and optional ANTHROPIC_API_KEY

# Setup database
npm run db:push    # Push schema
npm run db:seed    # Seed example data (optional)

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `ANTHROPIC_API_KEY` | No | For Claude AI integration |
| `OLLAMA_BASE_URL` | No | Defaults to `http://localhost:11434` |

## Troubleshooting

**Database connection error:**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running and accessible
- Run `npx prisma db push` to sync schema

**Ollama not connecting:**
- Ensure Ollama is running locally
- Check `OLLAMA_BASE_URL` if not using default port

**Vercel deployment fails:**
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `prisma generate` runs during build