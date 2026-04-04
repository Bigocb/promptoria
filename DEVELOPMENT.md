# PromptArchitect Backend - Local Development Guide

## Quick Start

### Prerequisites
- Python 3.11+
- pip (Python package manager)
- Optional: MySQL server for full integration testing

### Setup

1. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Create `.env.local` if it doesn't exist**
   ```bash
   cp .env.example .env.local
   ```
   The `.env.local` already has development defaults configured.

3. **Run development server**

   **On Linux/Mac:**
   ```bash
   ./dev.sh
   ```

   **On Windows:**
   ```bash
   dev.bat
   ```

   Or directly with Python:
   ```bash
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 3100
   ```

4. **Access the API**
   - **API Base URL**: http://localhost:3100
   - **Interactive Docs**: http://localhost:3100/docs (Swagger UI)
   - **ReDoc**: http://localhost:3100/redoc

## API Testing

### Using Swagger UI (Recommended)

1. Navigate to http://localhost:3100/docs
2. Click on any endpoint to expand it
3. Click "Try it out" button
4. Fill in required parameters
5. Click "Execute" to test

### Using cURL

**1. Sign up for new account**
```bash
curl -X POST http://localhost:3100/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

**2. Login (get JWT token)**
```bash
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

Response will include JWT token:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": { ... }
}
```

**3. Use token for authenticated requests**
```bash
TOKEN="your_token_here"

# Get user settings
curl -X GET http://localhost:3100/api/settings \
  -H "Authorization: Bearer $TOKEN"

# Create a prompt
curl -X POST http://localhost:3100/api/prompts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Prompt",
    "template_body": "Hello {{name}}, how are you?",
    "description": "A simple greeting prompt"
  }'
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout

### Prompts
- `GET /api/prompts` - List all prompts
- `GET /api/prompts/{id}` - Get prompt with versions
- `POST /api/prompts` - Create new prompt
- `PUT /api/prompts/{id}` - Update prompt metadata
- `DELETE /api/prompts/{id}` - Delete prompt
- `GET /api/prompts/{id}/versions` - Get all versions
- `POST /api/prompts/{id}/versions` - Create new version

### Snippets
- `GET /api/snippets` - List all snippets
- `GET /api/snippets/{id}` - Get snippet
- `POST /api/snippets` - Create snippet
- `PUT /api/snippets/{id}` - Update snippet
- `DELETE /api/snippets/{id}` - Delete snippet
- `GET /api/snippets/folders` - List folders
- `POST /api/snippets/folders` - Create folder
- `PUT /api/snippets/folders/{id}` - Update folder
- `DELETE /api/snippets/folders/{id}` - Delete folder

### Dashboard
- `GET /api/dashboard/stats` - Get workspace statistics

### Test Execution
- `POST /api/execute` - Run prompt (creates test run)
- `GET /api/execute/{prompt_version_id}` - Get test history

### Suggestions
- `POST /api/suggestions/{prompt_version_id}` - Get AI suggestions

### Settings
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update settings
- `POST /api/settings/api-key` - Set API key

### Taxonomy
- `GET /api/taxonomy/interaction-types` - List types
- `POST /api/taxonomy/interaction-types` - Create type
- `GET /api/taxonomy/categories` - List categories
- `POST /api/taxonomy/categories` - Create category

## Environment Variables

Configure in `.env.local`:

```
# Database (local MySQL or test instance)
DATABASE_URL=mysql+mysqlconnector://user:password@localhost:3306/promptoria_test

# JWT Configuration
JWT_SECRET=dev-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7

# API Keys (optional for development)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Environment
ENVIRONMENT=development
DEBUG=True

# CORS
CORS_ORIGINS=["http://localhost:3100", "https://syncellium.pro"]
```

## Database Migrations

**Initialize database:**
```bash
# Run initial migration
alembic upgrade head
```

**Create new migration after model changes:**
```bash
# Auto-generate migration
alembic revision --autogenerate -m "Description of changes"

# Apply it
alembic upgrade head
```

## Troubleshooting

### "ModuleNotFoundError: No module named 'X'"
- Run `pip install -r requirements.txt` to install dependencies

### "Can't connect to MySQL server"
- Make sure MySQL is running (or use test database)
- The app will start even if database unavailable
- Endpoints requiring DB will return connection error

### "Invalid email" when signing up
- Email must have @ and domain: test@example.com

### "Invalid token" when calling authenticated endpoints
- Make sure to use "Bearer TOKEN" in Authorization header
- Token is case-sensitive

### Port 3100 already in use
- Change port: `python -m uvicorn main:app --port 3101`

## Testing with Frontend

To test with the React frontend locally:

1. **Build Next.js as static files:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Configure React to call API:**
   - Update API_BASE_URL to http://localhost:3100
   - CORS is configured to allow localhost:3100

3. **Serve static files separately:**
   ```bash
   # Python simple server
   cd frontend/.next/out
   python -m http.server 3000
   ```

   Then access at http://localhost:3000

## Next Steps

1. Test all endpoints using Swagger UI
2. Verify authentication flow
3. Create sample prompts/snippets
4. Test prompt versioning
5. Once working locally → Deploy to DreamHost

