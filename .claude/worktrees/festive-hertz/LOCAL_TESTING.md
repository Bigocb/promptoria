# PromptArchitect - Local Testing Guide

## Quick Start (One Command)

### Windows:
```bash
start-local.bat
```

### Mac/Linux:
```bash
./start-local.sh
```

This starts both the API backend and frontend in one go.

---

## Manual Start (If Preferred)

### Terminal 1: Start Python API Backend
```bash
cd backend
python -m uvicorn main:app --reload --port 3100
```

You should see:
```
Uvicorn running on http://0.0.0.0:3100
```

### Terminal 2: Start Frontend Server
```bash
cd .next/out
python -m http.server 3000
```

You should see:
```
Serving HTTP on 0.0.0.0 port 3000
```

---

## Access the Application

Once both servers are running:

- **Frontend**: http://localhost:3000
- **API Base URL**: http://localhost:3100
- **API Interactive Docs**: http://localhost:3100/docs
- **API ReDoc**: http://localhost:3100/redoc

---

## Testing Workflow

### 1. Signup / Create Account
- Go to http://localhost:3000
- Click "Sign Up"
- Enter email & password (must be strong: 8+ chars, uppercase, lowercase, number)
- Submit

### 2. Login
- Enter same credentials
- You should be redirected to `/prompts`

### 3. View API Documentation
- While logged in, visit http://localhost:3100/docs
- This shows all available endpoints
- You can test endpoints directly from Swagger UI

### 4. Create a Prompt
- In frontend: Click "New Prompt"
- Add name, description, template
- Save

### 5. Create Snippets
- In frontend: Go to "Snippets"
- Create reusable text blocks
- Organize into folders

### 6. View Dashboard
- Go to http://localhost:3000/dashboard
- See workspace statistics

### 7. Test Settings
- Go to http://localhost:3000/settings
- Update theme, model preferences
- Changes sync to backend (visible in API)

---

## API Testing with Swagger UI

1. Navigate to http://localhost:3100/docs
2. Click on any endpoint to expand
3. Click "Try it out"
4. Fill in parameters
5. Click "Execute"

**Authenticated requests**: 
- Login first via `/api/auth/login`
- Copy the `access_token` from response
- Click "Authorize" button (top right)
- Paste token as: `Bearer YOUR_TOKEN_HERE`
- Now you can test authenticated endpoints

---

## Database

**Current Setup**: In-memory SQLite (default)
- No MySQL required for local testing
- Data persists during session only
- Perfect for UI testing

**With Real MySQL** (optional):
1. Update `backend/.env.local`:
   ```
   DATABASE_URL=mysql+mysqlconnector://user:pass@localhost:3306/promptoria_test
   ```
2. Ensure MySQL is running
3. Run migrations:
   ```bash
   cd backend
   alembic upgrade head
   ```

---

## Common Issues

### Port Already in Use
If port 3100 or 3000 are in use:

**Backend**:
```bash
python -m uvicorn main:app --port 3101
```

**Frontend**:
```bash
python -m http.server 3001
```

Then update `lib/api-config.ts` to point to new port.

### CORS Error
If you see CORS errors in browser console:
- Ensure backend is running on 3100
- Verify API_ENDPOINTS in `lib/api-config.ts` point to `http://localhost:3100`
- CORS is configured to allow localhost in backend

### "Can't connect to MySQL"
This is OK! The app works without MySQL for basic UI testing. The backend will show a warning but still start.

### Login fails
- Check that credentials are valid
- Must have strong password (8+ chars, uppercase, lowercase, digit)
- Email must be valid format (test@example.com)
- Check API logs in terminal for errors

### Frontend shows blank page
- Check that both servers are running
- Open browser console (F12) to see errors
- Ensure JavaScript is enabled
- Try clearing localStorage:
  ```javascript
  localStorage.clear()
  ```

---

## Features to Test

### Authentication
- ✓ Sign up with email/password
- ✓ Login with credentials
- ✓ Auto-redirect when logged in
- ✓ Logout clears token

### Prompts
- ✓ List prompts
- ✓ Create new prompt
- ✓ View prompt details
- ✓ Update prompt metadata
- ✓ Delete prompt
- ✓ View versions history
- ✓ Create new version

### Snippets
- ✓ List snippets
- ✓ Create snippet
- ✓ Update snippet content
- ✓ Delete snippet
- ✓ Create folders
- ✓ Organize snippets into folders

### Dashboard
- ✓ View statistics
- ✓ Recent prompts
- ✓ Recent test runs

### Settings
- ✓ Update theme
- ✓ Change default model
- ✓ Adjust temperature/max tokens
- ✓ Set API key

---

## What's NOT Implemented Yet (For Next Phase)

These features require backend work:
- ❌ Prompt execution (running prompts against LLM)
- ❌ Test results storage
- ❌ AI suggestions
- ❌ Snippet composition (merging snippets into prompts)
- ❌ Prompt compilation (variable substitution)

These will be added in Phase 5 when we integrate LLM APIs.

---

## Backend Tests (API Testing)

You can test the Python backend directly:

```bash
# Test signup
curl -X POST http://localhost:3100/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# Test login
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# Extract token from response, then:
TOKEN="your_token_here"

# Test authenticated endpoint
curl -X GET http://localhost:3100/api/settings \
  -H "Authorization: Bearer $TOKEN"
```

---

## Tips for Testing

1. **Open Developer Tools** (F12) to see network requests and errors
2. **Check Backend Logs** - Terminal showing API output shows SQL queries and errors
3. **Test with Swagger UI** - This is the easiest way to test API endpoints
4. **Keep localStorage Clean** - Between tests, clear localStorage if having auth issues
5. **Inspect Network Tab** - See what's being sent to the API and what responses come back

---

## Next Steps After Local Testing

Once everything works locally:
1. ✓ Build is ready (`.next/out` directory)
2. ✓ Backend is production-ready (no database required)
3. → Ready to discuss local slim models for suggestions (Ollama integration)
4. → Ready to deploy to DreamHost

---

## Feedback?

Issues found?
- Check the console (F12) for error messages
- Check backend terminal for API errors
- Update the code and rebuild:
  ```bash
  npm run build
  ```

