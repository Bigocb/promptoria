# PromptArchitect - Windows Setup Guide 🚀

## Your Repository Location
```
C:\Users\bigoc\dev\PromptArchitect
```

---

## Step-by-Step Setup (Windows)

### Phase 1: Prepare Your Machine (5 minutes)

#### 1. Install Prerequisites

**Node.js & npm** (if not already installed)
- Download: https://nodejs.org/ (LTS version, 18+)
- Install and verify:
  ```bash
  node --version   # Should show v18+
  npm --version    # Should show 8+
  ```

**PostgreSQL** (Database)
- Download: https://www.postgresql.org/download/windows/
- Install and remember the password for `postgres` user
- During installation, set port to 5432 (default)

**Git** (Version Control)
- Download: https://git-scm.com/download/win
- Install with default options

**VS Code** (Optional but recommended)
- Download: https://code.visualstudio.com/
- Install

#### 2. Create Project Directory

Open PowerShell or Command Prompt:

```bash
# Create the directory structure
mkdir C:\Users\bigoc\dev\PromptArchitect
cd C:\Users\bigoc\dev\PromptArchitect

# Initialize Git repository (optional)
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

---

### Phase 2: Copy Project Files (10 minutes)

#### Option A: Manual Copy (Easiest)

1. **Download all files from `/home/claude/`**
   - All source code files
   - Configuration files
   - Documentation

2. **Copy to your repository:**
   ```
   C:\Users\bigoc\dev\PromptArchitect\
   ├─ app/
   ├─ lib/
   ├─ components/
   ├─ prisma/
   ├─ public/
   ├─ package.json
   ├─ tsconfig.json
   ├─ tailwind.config.ts
   ├─ next.config.js
   ├─ postcss.config.js
   └─ [all documentation .md files]
   ```

#### Option B: Git Clone (If you set up a GitHub repo)

```bash
cd C:\Users\bigoc\dev
git clone https://github.com/yourusername/PromptArchitect.git
cd PromptArchitect
```

---

### Phase 3: Install Dependencies (5 minutes)

In PowerShell/Command Prompt at `C:\Users\bigoc\dev\PromptArchitect`:

```bash
# Install all npm dependencies
npm install

# This will:
# - Install Next.js, React, TypeScript
# - Install Prisma ORM
# - Install Tailwind CSS
# - Install all other dependencies
# Takes ~2-5 minutes
```

---

### Phase 4: Set Up Database (5 minutes)

#### 1. Create `.env.local` file

In `C:\Users\bigoc\dev\PromptArchitect`, create a file named `.env.local`:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/promptarchitect"

# Optional: Add your API keys for testing
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Development mode
NODE_ENV="development"
```

**Replace `YOUR_POSTGRES_PASSWORD`** with the password you set during PostgreSQL installation.

#### 2. Create Database and Run Migrations

```bash
# Create the database tables
npm run db:push

# Optional: Seed with sample data
npm run db:seed
```

If you get an error about the database not existing:
```bash
# Create the database manually in PostgreSQL
# Or run this in PowerShell to create it:
psql -U postgres -h localhost -c "CREATE DATABASE promptarchitect;"
```

---

### Phase 5: Start the Development Server (2 minutes)

```bash
npm run dev
```

You should see:
```
> dev
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

  ✓ Ready in xxx ms
```

Open your browser to: **http://localhost:3000**

---

## Verify Everything Works

### Home Page
- Visit `http://localhost:3000`
- You should see 4 feature cards:
  - 📚 Snippet Library
  - ⚡ Prompt Workspace
  - 📊 Version History
  - ▶️ Test Runner

### Each Feature

1. **Snippet Library** (`/snippets`)
   - Should show 2-3 sample snippets
   - Can copy content to clipboard

2. **Prompt Workspace** (`/prompts`)
   - Should show sample prompts
   - Can see snippet composition

3. **Version History** (`/history`)
   - Should show v1 and v2 of Product Description Generator
   - Can compare versions

4. **Test Runner** (`/test`)
   - Can select prompt
   - Can fill in variables
   - Can click "Execute Prompt"
   - Should see simulated output

5. **Library** (`/library`) - NEW
   - Browse saved prompts/skills/instructions
   - Search and filter
   - See ratings and usage stats

6. **Settings** (`/settings`) - NEW
   - Add AI providers
   - Configure OpenAI, Claude, etc.
   - Test connections
   - Track costs

---

## Troubleshooting

### Port 3000 Already in Use
```bash
# Find and kill the process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- -p 3001
```

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Fix:**
1. Make sure PostgreSQL is running
2. Check your DATABASE_URL in `.env.local`
3. Verify the password is correct
4. Try:
   ```bash
   psql -U postgres -h localhost
   # Should ask for password, then show postgres=#
   ```

### Module Not Found Errors
```bash
# Clean install
rm -r node_modules
rm package-lock.json
npm install
```

### TypeScript Errors
```bash
# Generate Prisma client
npx prisma generate

# Then restart dev server
npm run dev
```

---

## Add API Keys for Real Testing

Once everything works, add your real API keys to `.env.local`:

### For OpenAI:
```env
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxx"
```
Get from: https://platform.openai.com/api-keys

### For Claude (Anthropic):
```env
ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxx"
```
Get from: https://console.anthropic.com/

Then restart the dev server:
```bash
npm run dev
```

---

## Add Your First AI Provider

1. Go to `http://localhost:3000/settings`
2. Click "Add Provider"
3. Select "OpenAI" or "Anthropic"
4. Enter your API key
5. Select a model (e.g., "gpt-4" or "claude-3-sonnet")
6. Click "Test" to verify
7. Save

Now you can use it in the Test Runner!

---

## Project Structure

```
C:\Users\bigoc\dev\PromptArchitect\
│
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   ├── /snippets                # Snippet Library page
│   ├── /prompts                 # Prompt Workspace page
│   ├── /history                 # Version History page
│   ├── /test                    # Test Runner page
│   ├── /library                 # Library Browser page (NEW)
│   ├── /settings                # Settings page (NEW)
│   └── /api                     # API Routes
│       ├── /execute             # Execute prompts
│       ├── /prompts             # Prompt CRUD
│       ├── /snippets            # Snippet CRUD
│       ├── /testruns            # Test history
│       ├── /library             # Library endpoints (NEW)
│       └── /settings            # Settings endpoints (NEW)
│
├── lib/                          # Utility functions
│   ├── compiler.ts              # Prompt compilation logic
│   ├── library-manager.ts       # Library management (NEW)
│   ├── ai-provider-manager.ts   # Provider management (NEW)
│   └── utils.ts                 # Common utilities
│
├── components/                   # React components
│   └── ui/                       # Shadcn/UI components
│
├── prisma/                       # Database
│   ├── schema.prisma            # Data models
│   └── seed.ts                  # Sample data
│
├── public/                       # Static assets
│
├── Documentation/                # All .md files
│   ├── README.md
│   ├── GETTING_STARTED.md
│   ├── PROJECT_SUMMARY.md
│   ├── LIBRARY_DOCUMENTATION.md
│   ├── AI_PROVIDER_DOCUMENTATION.md
│   └── [more documentation]
│
├── .env.local                    # Local environment (CREATE THIS)
├── .env.example                  # Example env variables
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── next.config.js               # Next.js config
├── tailwind.config.ts           # Tailwind config
└── postcss.config.js            # PostCSS config
```

---

## Common Tasks

### Run Development Server
```bash
npm run dev
```
Visit: http://localhost:3000

### Build for Production
```bash
npm run build
npm run start
```

### Run Database Management
```bash
# Open Prisma Studio (visual database manager)
npm run db:studio
```

### Seed Database with Sample Data
```bash
npm run db:seed
```

### Create New Database Migration
```bash
# After changing schema.prisma
npm run db:push
```

### Reset Database
```bash
# ⚠️ Warning: This deletes all data!
npx prisma migrate reset
```

---

## IDE Setup (VS Code Recommended)

### Install Extensions
1. **TypeScript Vue Plugin** - For TypeScript support
2. **Tailwind CSS IntelliSense** - For Tailwind autocomplete
3. **Prisma** - For database schema highlighting
4. **Thunder Client** - For API testing

### Install Prettier (Code Formatter)
```bash
npm install -D prettier
```

Create `.prettierrc`:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2
}
```

---

## Docker Setup (Optional)

If you prefer Docker instead of local PostgreSQL:

1. Install Docker: https://www.docker.com/products/docker-desktop
2. Run:
```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- pgAdmin (database manager at http://localhost:5050)

Update `.env.local`:
```env
DATABASE_URL="postgresql://promptarchitect:promptarchitect@localhost:5432/promptarchitect"
```

---

## Git & Version Control

### Initial Commit
```bash
cd C:\Users\bigoc\dev\PromptArchitect
git add .
git commit -m "Initial PromptArchitect setup"
```

### Create GitHub Repository
1. Go to https://github.com/new
2. Create repository: `PromptArchitect`
3. Copy the commands and run:
```bash
git remote add origin https://github.com/yourusername/PromptArchitect.git
git branch -M main
git push -u origin main
```

### Daily Workflow
```bash
# Before starting
git pull

# During development
git add .
git commit -m "Your message"

# When done
git push
```

---

## Deployment Options

### Vercel (Easiest)
1. Push code to GitHub
2. Go to https://vercel.com
3. Import GitHub repository
4. Add environment variables
5. Deploy (automatic updates on git push)

### Docker + Any Server
```bash
docker build -t promptarchitect .
docker run -p 3000:3000 --env-file .env promptarchitect
```

### Traditional Server (AWS, DigitalOcean, etc.)
1. SSH into server
2. Install Node.js and PostgreSQL
3. Clone repository
4. `npm install && npm run build`
5. Use PM2 or systemd for process management

---

## Next Steps

1. ✅ Set up repository structure
2. ✅ Install dependencies
3. ✅ Create `.env.local` file
4. ✅ Initialize database
5. ✅ Run development server
6. ✅ Verify all pages work
7. ⬜ Add AI provider (OpenAI or Claude)
8. ⬜ Create your first prompt
9. ⬜ Test with different providers
10. ⬜ Save to library
11. ⬜ Deploy to production

---

## Support & Resources

### Documentation in Your Project
- `README.md` - Project overview
- `GETTING_STARTED.md` - Quick start
- `PROJECT_SUMMARY.md` - Architecture
- `LIBRARY_DOCUMENTATION.md` - Library features
- `AI_PROVIDER_DOCUMENTATION.md` - Provider setup
- `FILE_MANIFEST.md` - All files explained

### External Resources
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs/
- React Docs: https://react.dev
- Tailwind Docs: https://tailwindcss.com/docs

### Troubleshooting
- Check error messages in browser console (F12)
- Check terminal output for server errors
- Check `.env.local` file is correct
- Try `npm install` again
- Restart dev server with `npm run dev`

---

## You're All Set! 🎉

Your PromptArchitect repository is ready at:
```
C:\Users\bigoc\dev\PromptArchitect
```

**Next: Run `npm run dev` and visit http://localhost:3000** ✨
