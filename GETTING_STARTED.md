# PromptArchitect - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Clone & Install
```bash
# Clone the repository (or copy the files)
git clone https://github.com/yourusername/promptarchitect.git
cd promptarchitect

# Install dependencies
npm install
```

### Step 2: Setup Database
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your database credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/promptarchitect"
nano .env.local

# Create database schema
npm run db:push

# Seed with example data (optional)
npm run db:seed
```

### Step 3: Add API Keys
Edit `.env.local`:

**For OpenAI:**
```env
OPENAI_API_KEY="sk-your-key-here"
```

Get your key: https://platform.openai.com/api-keys

**For Anthropic (Claude):**
```env
ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

Get your key: https://console.anthropic.com/account/keys

### Step 4: Run the App
```bash
npm run dev
```

Visit: http://localhost:3000

---

## 📋 First-Time Walkthrough

### Demo: Product Description Prompt

**1. Create a Snippet** (2 min)
- Go to `/snippets`
- Click "New Snippet"
- Name: `Brand Voice`
- Content:
  ```
  You are a professional product writer.
  Be clear, concise, and persuasive.
  Always focus on customer benefits, not features.
  ```
- Click "Create"

**2. Create a Prompt** (3 min)
- Go to `/prompts`
- Click "New Prompt"
- Name: `Product Description Generator`
- Select the "Brand Voice" snippet
- Template Body:
  ```
  {{product_name}} is {{product_category}}.
  
  Price: {{product_price}}
  Key features: {{key_features}}
  
  Write a compelling product description for e-commerce.
  ```
- Leave model as `gpt-4`
- Click "Create Prompt"

**3. Test the Prompt** (2 min)
- Go to `/test`
- Enter test variables:
  - `product_name`: "Wireless Headphones"
  - `product_category`: "Premium Audio Equipment"
  - `product_price`: "$199.99"
  - `key_features`: "Noise cancellation, 40hr battery"
- Click "Execute Prompt"
- See the AI-generated description!

---

## 🎯 Key Features Explained

### Snippets
Reusable text blocks that can be used in multiple prompts.

**Use cases:**
- Brand voice guidelines
- Safety/compliance instructions
- Format specifications
- System prompts

### Prompts
Collections of snippets + template with variables.

**Features:**
- Compose from multiple snippets
- Version control (each edit creates new version)
- Model configuration (temperature, max_tokens)
- Variable templating with `{{variable_name}}`

### Test Runner
Execute prompts with real LLM APIs.

**What it shows:**
- LLM output
- Token usage (input + output)
- Cost (calculated from token usage)
- Latency (how fast the response was)
- Full test history

### Version History
Compare changes between prompt versions.

**Features:**
- Diff viewer (shows added/removed lines)
- Changelog notes
- Side-by-side comparison

---

## 🔧 Configuration

### Models
Change the default model in `/prompts`:
- `gpt-4` (most capable, most expensive)
- `gpt-3.5-turbo` (faster, cheaper)
- `claude-3-opus` (most capable)
- `claude-3-sonnet` (faster, cheaper)

### Temperature
Controls randomness (0 = deterministic, 1 = creative):
- `0.0-0.3`: Facts, summaries, structured output
- `0.5-0.7`: Balanced (default)
- `0.8-1.0`: Creative, brainstorming

### Max Tokens
Maximum response length:
- `256-512`: Short outputs
- `1024-2048`: Medium (default)
- `4096+`: Long documents

---

## 📊 Database

### Models
- **Workspace**: Top-level container
- **Folder**: Organize snippets/prompts
- **Snippet**: Reusable text blocks
- **Prompt**: Main prompt entity
- **PromptVersion**: Immutable snapshots
- **PromptComposition**: Links snippets to versions
- **TestRun**: Execution logs

### View Data
```bash
# Open Prisma Studio
npm run db:studio
```

Then visit: http://localhost:5555

---

## 🐛 Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
npm install @prisma/client
npm run db:push
```

### "ECONNREFUSED: Connection refused"
Database isn't running. Start PostgreSQL:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Docker
docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres
```

### "API key not provided"
Make sure `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set in `.env.local`

### Variables show "Missing required variables"
Check that all `{{variable_name}}` placeholders in your template are provided in the test form.

---

## 📚 API Examples

### Execute a Prompt
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "promptVersionId": "version-product-desc-v2",
    "variables": {
      "product_name": "Headphones",
      "product_category": "Audio"
    }
  }'
```

### Fetch Test History
```bash
curl "http://localhost:3000/api/testruns?promptVersionId=version-product-desc-v2&limit=5"
```

### Create a Snippet
```bash
curl -X POST http://localhost:3000/api/snippets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SEO Guidelines",
    "content": "Include 3-5 keywords per 100 words...",
    "workspaceId": "workspace_default"
  }'
```

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in dashboard
# - DATABASE_URL
# - OPENAI_API_KEY
```

### Docker
```bash
docker build -t promptarchitect .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e OPENAI_API_KEY="sk-..." \
  promptarchitect
```

### Self-Hosted
1. Build: `npm run build`
2. Start: `npm start`
3. Use process manager (PM2, systemd, etc.)

---

## 📖 Next Steps

1. **Read the main README** for architecture details
2. **Explore the database** with `npm run db:studio`
3. **Create your first prompt** using the walkthrough above
4. **Test with real variables** relevant to your use case
5. **Monitor costs** in the Test Runner

---

## 💡 Tips & Tricks

**Prompt Engineering Best Practices:**
- Start simple, then add complexity
- Use snippets for reusable patterns
- Test with multiple variable combinations
- Monitor latency and costs
- Version regularly with meaningful changelogs

**Cost Optimization:**
- Use gpt-3.5-turbo for non-critical tasks
- Reduce max_tokens if possible
- Batch similar tests
- Monitor cost per test

**Quality:**
- Include specific format instructions in snippets
- Use variables for dynamic content
- Test edge cases and variations
- Compare versions to track improvements

---

## 📞 Support

- **Issues**: Check troubleshooting section above
- **Questions**: See API documentation in README.md
- **Contributions**: PRs welcome!

---

**Happy prompting! 🎉**
