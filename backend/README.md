# PromptArchitect Backend - FastAPI

Python/FastAPI backend for PromptArchitect. Migrated from Node.js to support DreamHost shared hosting.

## Setup

### 1. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update `.env.local` with your actual database credentials and API keys:

```
DATABASE_URL=mysql+mysql.connector://user:password@host:3306/dbname
JWT_SECRET=your-secret-key
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Initialize Database (First Time Only)

```bash
alembic upgrade head
```

## Running the Server

### Development

```bash
uvicorn main:app --reload --port 3100
```

The API will be available at `http://localhost:3100`

API documentation: `http://localhost:3100/docs`

### Production

```bash
gunicorn main:app --bind 0.0.0.0:3100 --workers 4
```

## Project Structure

```
backend/
├── main.py                    # FastAPI app initialization
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
├── alembic/                  # Database migrations
├── app/
│   ├── core/                 # Configuration & utilities
│   │   ├── config.py         # Settings from environment
│   │   ├── security.py       # JWT & password hashing
│   │   └── database.py       # SQLAlchemy setup
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic request/response models
│   ├── api/                  # FastAPI route handlers
│   ├── crud/                 # Database CRUD operations
│   └── utils/                # Utility functions
└── tests/                    # Test files
```

## Database Models

- User - User accounts
- UserSettings - User preferences
- Workspace - Per-user container (1:1 with User)
- Prompt - Prompt templates
- PromptVersion - Immutable prompt versions
- PromptComposition - Snippet-to-version relationships
- Snippet - Reusable text blocks
- TestRun - Execution logs
- AgentInteractionType - Top-level categories
- PromptCategory - Subcategories
- Folder - Organization structure

## API Endpoints

### Auth
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Prompts
- `GET /api/prompts` - List prompts
- `POST /api/prompts` - Create prompt
- `GET /api/prompts?promptId={id}` - Get prompt details
- `PUT /api/prompts/{id}` - Update prompt
- `DELETE /api/prompts/{id}` - Delete prompt

### Snippets
- `GET /api/snippets` - List snippets
- `POST /api/snippets` - Create snippet
- `PUT /api/snippets/{id}` - Update snippet
- `DELETE /api/snippets/{id}` - Delete snippet

### Dashboard
- `GET /api/dashboard/stats` - User statistics

### Settings
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update settings
- `POST /api/settings/api-key` - Save API key

### Execute
- `POST /api/execute` - Execute prompt against LLM
- `GET /api/execute?promptVersionId={id}` - Get test runs

### Suggestions
- `POST /api/suggestions` - Get Claude suggestions

### Taxonomy
- `GET /api/taxonomy/interaction-types` - List interaction types
- `GET /api/taxonomy/categories` - List categories
- `POST /api/taxonomy/interaction-types` - Create interaction type
- `POST /api/taxonomy/categories` - Create category

## Database Migrations

### Create New Migration

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply Migrations

```bash
alembic upgrade head
```

### Rollback Migration

```bash
alembic downgrade -1
```

## Testing

```bash
pytest tests/
```

## Deployment

See [../DEPLOYMENT.md](../DEPLOYMENT.md) for deployment instructions.

## Notes

- JWT tokens expire after 7 days
- Password hashing uses bcrypt with salt=10
- Database uses MySQL 8.0+
- All database operations are async
