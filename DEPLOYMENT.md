# Deployment Guide: Vercel + Render

This app is deployed across two platforms for optimal performance:
- **Frontend**: Vercel (static Next.js export)
- **Backend**: Render.com (Python/FastAPI)

## Architecture

```
GitHub Repo (main branch)
    ↓
    ├→ Vercel (Frontend)
    │  https://promptoria.vercel.app
    │
    └→ Render (Backend API)
       https://promptoria-api.onrender.com
```

## Setup Instructions

### 1. Vercel Setup (Frontend)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Import Project" and select your GitHub repo
3. Framework: **Next.js**
4. Build Command: `npm run build`
5. Output Directory: `out`
6. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
   ```
7. Click "Deploy"

**Note your Vercel URL** (e.g., `https://promptoria.vercel.app`)

### 2. Render Setup (Backend)

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect GitHub repo
4. Configure:
   - **Name**: `promptoria-api`
   - **Environment**: `Python 3.11`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

5. Environment Variables:
   ```
   CORS_ORIGINS=["https://your-vercel-domain.vercel.app"]
   DATABASE_URL=sqlite:///./promptoria.db
   DEBUG=false
   ```

6. Click "Deploy"

**Note your Render URL** (e.g., `https://promptoria-api.onrender.com`)

### 3. GitHub Secrets

Add these to your repo (Settings → Secrets and variables → Actions):

**Vercel Secrets:**
```
VERCEL_TOKEN        → Get from Vercel Settings → Tokens
VERCEL_ORG_ID       → Your Vercel account ID (Settings)
VERCEL_PROJECT_ID   → From Vercel project settings
```

**Environment:**
```
NEXT_PUBLIC_API_URL → https://your-render-backend.onrender.com
```

**Render Secrets (for backend redeployment):**
```
RENDER_SERVICE_ID   → From Render URL: https://dashboard.render.com/web/srv-xxxxx
RENDER_DEPLOY_KEY   → From Render → Service Settings → Deploy Hook
```

### 4. CORS Configuration

Update your Render environment variables with your Vercel domain:

In Render Dashboard:
1. Go to your service
2. Settings → Environment
3. Update `CORS_ORIGINS` to include your Vercel URL

## Deployment Flow

When you push to `main` branch:

1. ✅ GitHub Actions builds Next.js → uploads to Vercel
2. ✅ Vercel automatically deploys frontend
3. ✅ GitHub Actions triggers Render backend redeployment
4. ✅ Both live and synced

## Testing Deployment

After both services are live:

```bash
# Test frontend
curl https://your-vercel-domain.vercel.app

# Test backend
curl https://your-render-backend.onrender.com/api/taxonomy/interaction-types
```

## Local Development

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --reload --port 3100

# Terminal 2: Frontend  
npm run dev
# http://localhost:3001
```

## Important Notes

### Database on Render Free Tier
- SQLite data is **ephemeral** (lost on redeploy)
- For production, upgrade Render to paid tier or use PostgreSQL:
  1. In Render dashboard, create a PostgreSQL database
  2. Update `DATABASE_URL` to point to PostgreSQL
  3. Redeploy backend

### First Deploy
Render free tier may take 30 seconds to start up. Subsequent deploys are faster.

## Troubleshooting

**Frontend can't reach backend:**
- Check `NEXT_PUBLIC_API_URL` environment variable in Vercel
- Verify Render backend is running (check logs in Render dashboard)
- Check CORS_ORIGINS in Render environment matches your Vercel URL

**Render keeps going to sleep:**
- Free tier pauses inactive services after 15 minutes
- Upgrade to paid tier for continuous uptime
- Or ping the service periodically to keep it awake

**Database lost after deploy:**
- This is normal on free tier (ephemeral storage)
- Upgrade Render tier or migrate to persistent database
