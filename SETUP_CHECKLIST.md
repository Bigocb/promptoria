# PromptArchitect Windows Setup Checklist ✅

## Before You Start
- [ ] Windows 10/11 installed
- [ ] Administrator access
- [ ] 2GB+ free disk space
- [ ] Internet connection

---

## Phase 1: Install Prerequisites (First Time Only)

### Node.js
- [ ] Download from https://nodejs.org/ (LTS version)
- [ ] Install with default options
- [ ] Verify: Open PowerShell, type `node --version`
- [ ] Should show: `v18.x.x` or higher

### PostgreSQL
- [ ] Download from https://www.postgresql.org/download/windows/
- [ ] Install with default options
- [ ] Remember the `postgres` password you set
- [ ] Port should be 5432 (default)
- [ ] Keep running in background

### Git (Optional)
- [ ] Download from https://git-scm.com/download/win
- [ ] Install with default options
- [ ] Verify: `git --version`

### VS Code (Optional)
- [ ] Download from https://code.visualstudio.com/
- [ ] Install and open

---

## Phase 2: Create Project Directory

- [ ] Create folder: `C:\Users\bigoc\dev\PromptArchitect`
- [ ] Open PowerShell in that folder (Right-click → Open PowerShell here)
- [ ] Run: `git init` (optional, if you installed Git)

---

## Phase 3: Download & Copy Files

### Option A: Manual Download (Recommended for First Time)
- [ ] Download all files from the cloud
- [ ] Copy to `C:\Users\bigoc\dev\PromptArchitect\`
- [ ] Should have folders: `app`, `lib`, `components`, `prisma`, `public`
- [ ] Should have files: `package.json`, `tsconfig.json`, `next.config.js`

### Option B: Git Clone
- [ ] Have GitHub repository created and URL ready
- [ ] Open PowerShell at `C:\Users\bigoc\dev\`
- [ ] Run: `git clone https://github.com/yourusername/PromptArchitect.git`
- [ ] Run: `cd PromptArchitect`

---

## Phase 4: Install Dependencies

In PowerShell at `C:\Users\bigoc\dev\PromptArchitect\`:

- [ ] Run: `npm install`
- [ ] Wait for completion (2-5 minutes)
- [ ] Should see: `added X packages`

---

## Phase 5: Configure Environment

- [ ] Create `.env.local` file in `C:\Users\bigoc\dev\PromptArchitect\`
- [ ] Add this content:
  ```env
  DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/promptarchitect"
  NODE_ENV="development"
  ```
- [ ] Replace `YOUR_PASSWORD` with your PostgreSQL password
- [ ] Save file

---

## Phase 6: Set Up Database

In PowerShell at `C:\Users\bigoc\dev\PromptArchitect\`:

- [ ] Run: `npm run db:push`
- [ ] Should see: `✓ Generated Prisma Client`
- [ ] Database tables created
- [ ] (Optional) Run: `npm run db:seed` for sample data

---

## Phase 7: Start Development Server

In PowerShell at `C:\Users\bigoc\dev\PromptArchitect\`:

- [ ] Run: `npm run dev`
- [ ] Should see: `✓ Ready in XXXms`
- [ ] Should see: `Local: http://localhost:3000`
- [ ] Note: Keep this PowerShell window open!

---

## Phase 8: Test Everything

Open browser to http://localhost:3000:

### Home Page
- [ ] See 4 feature cards
- [ ] No errors in browser console (F12)

### Snippet Library
- [ ] Click "Snippets" or go to http://localhost:3000/snippets
- [ ] See sample snippets
- [ ] Can copy content to clipboard

### Prompt Workspace
- [ ] Click "Prompts" or go to http://localhost:3000/prompts
- [ ] See sample prompts
- [ ] See snippet composition

### Version History
- [ ] Click "History" or go to http://localhost:3000/history
- [ ] See v1 and v2 of Product Description Generator
- [ ] Can compare versions

### Test Runner
- [ ] Click "Test" or go to http://localhost:3000/test
- [ ] See prompt selection
- [ ] Can fill in variables
- [ ] Can click "Execute Prompt"
- [ ] See simulated output

### Library (NEW)
- [ ] Go to http://localhost:3000/library
- [ ] See saved items
- [ ] Can search and filter

### Settings (NEW)
- [ ] Go to http://localhost:3000/settings
- [ ] See "Add Provider" button
- [ ] UI loads without errors

---

## Phase 9: Add AI Provider (Optional)

To use real AI models:

### Get API Keys
- [ ] OpenAI: https://platform.openai.com/api-keys
- [ ] Claude: https://console.anthropic.com/

### Add to .env.local
- [ ] Add: `OPENAI_API_KEY="sk-..."`
- [ ] OR: `ANTHROPIC_API_KEY="sk-ant-..."`
- [ ] Save file
- [ ] Restart dev server (Ctrl+C, then `npm run dev`)

### Configure in Settings
- [ ] Go to http://localhost:3000/settings
- [ ] Click "Add Provider"
- [ ] Select OpenAI or Anthropic
- [ ] Paste API key
- [ ] Choose model
- [ ] Click "Test"
- [ ] Should see: "✓ Connection successful"
- [ ] Click "Save"

---

## Phase 10: Create Your First Prompt (Optional)

- [ ] Go to http://localhost:3000/prompts
- [ ] Click "New Prompt"
- [ ] Enter name and template
- [ ] Add variables like `{{product_name}}`
- [ ] Save

### Test It
- [ ] Go to http://localhost:3000/test
- [ ] Select your prompt
- [ ] Fill in variables
- [ ] Click "Execute Prompt"
- [ ] See AI response (if you added API key)

---

## Phase 11: Save to Library (Optional)

After testing a prompt:

- [ ] Go to http://localhost:3000/library
- [ ] Click "New Item"
- [ ] Select "Prompt" type
- [ ] Enter name, description, category
- [ ] Add tags
- [ ] Save
- [ ] Now it's in your knowledge base!

---

## Common Issues & Fixes

### Port 3000 Already in Use
```bash
netstat -ano | findstr :3000
taskkill /PID <NUMBER> /F
npm run dev
```

### Can't Connect to Database
- [ ] Check PostgreSQL is running (search "Services" in Windows)
- [ ] Check DATABASE_URL in `.env.local`
- [ ] Verify password is correct
- [ ] Try creating database manually:
  ```bash
  psql -U postgres -h localhost
  # Enter password
  CREATE DATABASE promptarchitect;
  \q
  ```

### Module Not Found
```bash
rm node_modules -r
npm install
npm run dev
```

### TypeScript Errors
```bash
npx prisma generate
npm run dev
```

### Blank Page or 404 Errors
- [ ] Check PowerShell shows: `✓ Ready in XXXms`
- [ ] Try hard refresh: Ctrl+Shift+Delete
- [ ] Check browser console (F12) for errors

---

## Folder Structure Verification

After everything is set up, you should have:

```
C:\Users\bigoc\dev\PromptArchitect\
├── app/                    ✅ Has pages and api routes
├── lib/                    ✅ Has .ts files
├── components/             ✅ Has UI components
├── prisma/                 ✅ Has schema.prisma
├── public/                 ✅ Has static files
├── .env.local              ✅ You created this
├── .env.example            ✅ Template file
├── package.json            ✅ Has dependencies listed
├── tsconfig.json           ✅ TypeScript config
├── next.config.js          ✅ Next.js config
├── tailwind.config.ts      ✅ Tailwind config
└── [documentation .md files]  ✅ Guides and docs

node_modules/              ✅ Installed by npm
```

---

## You're Ready! 🎉

Once all ✅ are checked:

### Run This Command
```bash
npm run dev
```

### Visit This URL
```
http://localhost:3000
```

### You Should See
- ✓ Home page with 4 features
- ✓ Navigation to all pages works
- ✓ No console errors (F12)
- ✓ Sample data loads

---

## Next: First Steps

### Option 1: Explore the Demo
- Browse all pages
- Test sample prompts
- Read all documentation

### Option 2: Add Real APIs
- Add OpenAI or Claude API key
- Test with real models
- Compare providers

### Option 3: Create Your Prompts
- Go to Prompts page
- Create new prompt
- Test it
- Save to library

### Option 4: Deploy
- Push to GitHub
- Deploy to Vercel
- Share with team

---

## Support Files

All documentation is in your project folder:

- `README.md` - Overview
- `GETTING_STARTED.md` - Quick start
- `WINDOWS_SETUP_GUIDE.md` - This guide
- `PROJECT_SUMMARY.md` - Architecture
- `LIBRARY_DOCUMENTATION.md` - Library features
- `AI_PROVIDER_DOCUMENTATION.md` - Provider setup
- `FILE_MANIFEST.md` - All files listed

---

## Quick Links

- Node.js: https://nodejs.org/
- PostgreSQL: https://www.postgresql.org/download/windows/
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs/
- TypeScript: https://www.typescriptlang.org/
- Tailwind CSS: https://tailwindcss.com/docs

---

## You're All Set! 🚀

Your PromptArchitect repository is ready to go!

**Location:** `C:\Users\bigoc\dev\PromptArchitect`

**Command:** `npm run dev`

**URL:** `http://localhost:3000`

Enjoy! ✨
