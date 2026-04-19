# How to Download PromptArchitect to Your Desktop

## Quick Summary

Everything is in `/home/claude/` on the Claude environment. You need to:
1. Collect all project files
2. Download as a ZIP file
3. Extract on your desktop
4. Run locally

---

## Method 1: Manual Download (Easiest)

### Step 1: Download Key Directories

The most important files are in these directories:

**Backend:**
```
/home/claude/lib/                 All logic files
/home/claude/prisma/              Database schema
/home/claude/app/                 All pages and APIs
```

**Configuration:**
```
/home/claude/package.json          Dependencies
/home/claude/tsconfig.json         TypeScript config
/home/claude/tailwind.config.ts    Tailwind config
/home/claude/next.config.js        Next.js config
/home/claude/.env.example          Environment template
```

**Documentation:**
```
/home/claude/*.md                  All markdown docs
/home/claude/*.txt                 All text files
```

### Step 2: Create ZIP on Claude's Server

I'll create a ZIP file for you to download:

---

## Method 2: Using This Script

Copy and run this on your desktop to pull everything:

```bash
# Create directory
mkdir -p ~/Projects/PromptArchitect
cd ~/Projects/PromptArchitect

# Copy from Claude environment (simulated)
# Instead, download the ZIP file provided

unzip promptarchitect.zip
cd promptarchitect

# Install dependencies
npm install

# Setup database
cp .env.example .env.local
# Edit .env.local and add DATABASE_URL, API keys

# Run migrations
npm run db:push

# Start development server
npm run dev
```

---

## Method 3: Git-Based (Best for Updates)

### If You Have Git/GitHub:

1. Create new repo on GitHub
2. Clone to desktop
3. Copy all files from Claude
4. Push to GitHub
5. Pull anytime for updates

```bash
git clone https://github.com/YOUR_USERNAME/promptarchitect.git
cd promptarchitect
npm install
cp .env.example .env.local
npm run db:push
npm run dev
```

---

## What Files You Need

### Essential (REQUIRED)
```
✅ package.json          - Dependencies list
✅ tsconfig.json         - TypeScript config
✅ next.config.js        - Next.js config
✅ prisma/schema.prisma  - Database schema
✅ .env.example          - Environment template
✅ app/                  - All pages and APIs
✅ lib/                  - All logic files
✅ components/           - Reusable components
✅ public/               - Static assets
```

### Recommended (Helpful)
```
📚 README.md                    - Main documentation
📚 GETTING_STARTED.md          - Setup guide
📚 PROJECT_SUMMARY.md          - Architecture overview
📚 AI_PROVIDER_DOCUMENTATION.md - AI provider docs
📚 LIBRARY_DOCUMENTATION.md     - Library docs
```

### Optional (Nice to Have)
```
📋 *.md files - Various documentation
📋 Dockerfile - For Docker deployment
📋 docker-compose.yml - Docker setup
```

---

## File Directory Structure After Download

```
promptarchitect/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   ├── /snippets/page.tsx
│   ├── /prompts/page.tsx
│   ├── /history/page.tsx
│   ├── /test/page.tsx
│   ├── /library/page.tsx          (NEW)
│   ├── /settings/page.tsx         (NEW)
│   └── /api/
│       ├── execute/route.ts
│       ├── prompts/route.ts
│       ├── snippets/route.ts
│       ├── library/route.ts       (NEW)
│       └── settings/route.ts      (NEW)
│
├── lib/
│   ├── compiler.ts
│   ├── utils.ts
│   ├── library-manager.ts         (NEW)
│   └── ai-provider-manager.ts     (NEW)
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── components/
│   └── ui/
│
├── public/
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── .env.example
├── Dockerfile
├── docker-compose.yml
│
└── *.md (documentation)
```

---

## Setup After Download

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/promptarchitect
OPENAI_API_KEY=sk-... (optional, if using OpenAI)
ANTHROPIC_API_KEY=claude-... (optional, if using Claude)
```

### 3. Setup Database

Option A: PostgreSQL locally
```bash
# Install PostgreSQL
# Create database
createdb promptarchitect

# Run migrations
npm run db:push

# Seed with sample data (optional)
npm run db:seed
```

Option B: Docker
```bash
docker-compose up -d
# Database runs in container
```

### 4. Start Development Server
```bash
npm run dev
```

Visit: `http://localhost:3000`

### 5. Configure AI Providers

Go to `http://localhost:3000/settings`
- Add OpenAI, Claude, or other provider
- Enter API key
- Test connection
- Save

---

## Troubleshooting

### "Cannot find module"
```bash
npm install
npm run db:push
```

### "Database connection error"
Check DATABASE_URL in .env.local:
```
postgresql://postgres:password@localhost:5432/promptarchitect
```

### "Port 3000 already in use"
```bash
npm run dev -- -p 3001
# Or kill process using port 3000
```

### "Module not found: @prisma/client"
```bash
npm install @prisma/client
npm install -D prisma
npm run db:push
```

---

## Deployment Options

### Option 1: Local Development
```bash
npm run dev
# http://localhost:3000
```

### Option 2: Docker
```bash
docker-compose up -d
# http://localhost:3000
```

### Option 3: Vercel (Cloud)
```bash
npm install -g vercel
vercel
# Follow prompts
```

### Option 4: Self-Hosted
- Deploy to AWS, DigitalOcean, Heroku, etc.
- Use Dockerfile provided
- Configure DATABASE_URL for cloud database

---

## Total Package Size

- **Code files**: ~500KB
- **Node modules** (after `npm install`): ~300MB
- **Database** (PostgreSQL): Depends on data

**Download size**: ~1-2MB (without node_modules)
**After npm install**: ~300MB total

---

## Next Steps

1. ✅ Download the ZIP or clone repository
2. ✅ Extract to desktop
3. ✅ Run `npm install`
4. ✅ Create `.env.local` with DATABASE_URL
5. ✅ Run `npm run db:push`
6. ✅ Run `npm run dev`
7. ✅ Visit `http://localhost:3000`
8. ✅ Add AI provider in Settings
9. ✅ Start creating prompts!

---

## Support

If you get stuck:
1. Check README.md
2. Check GETTING_STARTED.md
3. Check error message carefully
4. Try `npm install` again
5. Make sure PostgreSQL is running

---

## Summary

PromptArchitect is a full Next.js application that runs on your desktop. 
After downloading, it's just:

```bash
npm install          # Install dependencies
npm run db:push      # Setup database
npm run dev          # Start server
# Visit http://localhost:3000
```

Then configure your AI providers and start building prompts!
