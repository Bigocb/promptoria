# Promptoria 🏗️

A **modular, versioned prompt management system** for building, testing, and deploying LLM prompts at scale.

## Features ✨

### Phase 1-3: Builder & Management ✅
- **Snippet Library**: Manage reusable text blocks (brand voice, instructions, etc.)
- **Prompt Workspace**: Compose prompts from snippets with drag-and-drop support
- **Version History**: Track changes and compare versions with diff viewer
- **Immutable Versions**: Versions are snapshots; editing creates new versions

### Phase 4: Execution & Testing ✅
- **Test Runner**: Execute prompts with real LLM APIs (OpenAI, Anthropic)
- **Variable Substitution**: Dynamic `{{variable_name}}` support
- **Cost Tracking**: Calculate and display per-test costs
- **Token Monitoring**: Input/output token counting and analysis
- **Test History**: Log all executions with latency and error tracking

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS + Shadcn/UI
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit (ready for implementation)

## Project Structure

```
promptarchitect/
├── app/
│   ├── api/
│   │   ├── execute/          # Execute prompts with LLM
│   │   ├── prompts/          # Fetch prompts
│   │   ├── snippets/         # Manage snippets
│   │   └── testruns/         # Test history
│   ├── snippets/             # Snippet Library UI
│   ├── prompts/              # Prompt Workspace UI
│   ├── history/              # Version History UI
│   ├── test/                 # Test Runner UI
│   ├── layout.tsx
│   ├── page.tsx              # Home dashboard
│   └── globals.css
├── components/
│   └── ui/                   # Shadcn components
├── lib/
│   ├── compiler.ts           # Logic engine (compile, validate, substitute)
│   └── utils.ts
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed data
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .env.example
```

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+
- OpenAI API key (or Anthropic for Claude)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/promptarchitect"
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

### 4. Setup Database
```bash
# Push schema to database
npm run db:push

# Or migrate (create migration)
npm run db:migrate

# Seed with example data
npm run db:seed
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

## Usage Guide

### Creating a Snippet

1. Go to **Snippet Library** (`/snippets`)
2. Click "New Snippet"
3. Enter:
   - **Name**: e.g., "Brand Voice"
   - **Description**: What this snippet is for
   - **Content**: The reusable text
4. Click "Create"

**Example Snippet:**
```
You are a friendly, professional assistant.
- Maintain a conversational but professional tone
- Be solution-oriented
- Always build trust with the user
```

### Creating a Prompt

1. Go to **Prompt Workspace** (`/prompts`)
2. Click "New Prompt"
3. Enter:
   - **Name**: e.g., "Product Description Generator"
   - **Description**: What this prompt does
4. **Compose with Snippets**: Select snippets to include
5. **Template Body**: Write your prompt template using `{{variable_name}}` syntax
6. **Configure Model**: Set temperature, max tokens, top_p
7. Click "Create Prompt"

**Example Template:**
```
{{brand_voice_snippet}}

Write a product description for {{product_name}}.
- Category: {{product_category}}
- Price: {{product_price}}
- Key features: {{key_features}}

Keep it under 150 words and include a CTA.
```

### Testing a Prompt

1. Go to **Test Runner** (`/test`)
2. Select the **Prompt ID** and **Version ID**
3. Fill in the **Variables** form with test values
4. Click "Execute Prompt"
5. View:
   - **Output**: LLM response
   - **Tokens**: Input/output token counts
   - **Cost**: USD amount spent
   - **Latency**: Response time

**Example Variables:**
```json
{
  "product_name": "Wireless Headphones",
  "product_category": "Audio",
  "product_price": "$199.99",
  "key_features": "Noise cancellation, 40hr battery"
}
```

### Comparing Versions

1. Go to **Version History** (`/history`)
2. Check two versions to compare
3. View:
   - **Diff**: Red (removed) and green (added) lines
   - **Changelog**: What changed between versions
   - **Timestamps**: When each version was created

## Core Components

### Compiler Engine (`lib/compiler.ts`)

The logic engine that powers prompt execution:

```typescript
// Compile a prompt version
const compiled = await compilePrompt(versionId)
// Returns: { compiled, variables, model_config, changeLog }

// Extract variables from template
const vars = extractVariables(template)
// Returns: Set of variable names

// Substitute variables in compiled prompt
const { result, missingVariables } = substituteVariables(prompt, { var1: "value" })

// Full execution
const final = await executePreparedPrompt(versionId, variables)
```

### API Routes

#### `POST /api/execute`
Execute a prompt with the LLM API.

**Request:**
```json
{
  "promptVersionId": "version-product-desc-v2",
  "variables": {
    "product_name": "Headphones",
    "product_category": "Audio"
  }
}
```

**Response:**
```json
{
  "testRunId": "test_123",
  "output": "Premium wireless headphones...",
  "inputTokens": 427,
  "outputTokens": 156,
  "totalTokens": 583,
  "costUsd": 0.0156,
  "latencyMs": 2341,
  "status": "success"
}
```

#### `GET /api/prompts`
Fetch prompts and versions.

**Parameters:**
- `promptId` (optional): Get specific prompt with all versions
- `workspaceId` (optional): Filter by workspace

#### `GET /api/snippets`
Fetch snippets.

**Parameters:**
- `snippetId` (optional): Get specific snippet
- `workspaceId` (optional): Filter by workspace

#### `GET /api/testruns`
Fetch test history and statistics.

**Parameters:**
- `promptVersionId`: Filter by prompt version
- `promptId`: Filter by prompt
- `status`: Filter by status (success, error)
- `limit`: Max results (default: 20)

## Database Schema

### Key Models

**PromptVersion**
- Immutable snapshot of a prompt
- Contains `template_body` and `model_config` (JSON)
- Linked to `Snippet`s via `PromptComposition`
- Ordered by rank for composition

**Snippet**
- Reusable text blocks
- Can be used in multiple prompts
- Manual versioning

**PromptComposition**
- Join table between `PromptVersion` and `Snippet`
- Includes `rank` for snippet ordering

**TestRun**
- Execution log for each test
- Records: variables, output, tokens, cost, latency, status

## Advanced Usage

### Seeding Custom Data

Edit `prisma/seed.ts` to add your own:
- Workspaces
- Snippets
- Prompts
- Versions

Then run:
```bash
npm run db:seed
```

### Adding New Models

1. Update `prisma/schema.prisma`
2. Run migration:
   ```bash
   npm run db:migrate
   ```
3. Update API routes as needed

### Cost Calculation

Token pricing is calculated based on model:

```typescript
const TOKEN_COSTS = {
  'gpt-4': { input: 0.00003, output: 0.00006 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-3-opus': { input: 0.000015, output: 0.00075 },
  'claude-3-sonnet': { input: 0.000003, output: 0.00015 },
}
```

Update these in `/api/execute/route.ts` with current pricing.

## Security & Best Practices

✅ **Implemented:**
- Immutable prompt versions (prevents accidental overwrites)
- Brace validation (prevents malformed templates)
- Variable extraction (shows required fields before execution)
- Workspace isolation (scope data by workspaceId)

🔧 **TODO:**
- [ ] User authentication (Clerk, Auth0, etc.)
- [ ] Workspace-level permissions
- [ ] API key management
- [ ] Rate limiting
- [ ] Audit logging

## Troubleshooting

### Database Connection Error
```
error: database does not exist
```
Create the database:
```bash
createdb promptarchitect
npm run db:push
```

### Missing Variables Error
```
error: Missing required variables: product_name, product_category
```
Ensure all `{{variable}}` placeholders in the template have corresponding values in the test form.

### API Key Error
```
error: OpenAI API key not provided or configured
```
Set `OPENAI_API_KEY` in `.env.local`

### Unclosed Braces Error
```
error: Content contains unclosed or malformed curly braces
```
Check snippet/template content for unmatched `{{` or `}}`

## Performance Optimization

- **Caching**: Test results are cached for cost analysis
- **Token Batching**: Multiple tests in a session reduce API overhead
- **Variable Extraction**: Variables are extracted once during compilation

## Next Steps / Roadmap

- [ ] Drag-and-drop snippet reordering in workspace
- [ ] Prompt templates library with pre-built examples
- [ ] Analytics dashboard (costs, latency trends)
- [ ] Collaborative editing and sharing
- [ ] Batch testing (multiple variables at once)
- [ ] Webhook integration for automated testing
- [ ] Version rollback functionality
- [ ] A/B testing between prompt versions
- [ ] Integration with prompt marketplaces

## API Documentation

Full API docs available at `/api/docs` (Swagger UI coming soon)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the Database Schema
3. Open an issue with:
   - Error message
   - Steps to reproduce
   - Expected behavior

---

**Built with ❤️ for prompt engineers**
