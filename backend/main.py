"""
FastAPI application for PromptArchitect backend.
Migrated from Node.js to Python.
Production database: Render PostgreSQL (automatic connection via DATABASE_URL env var)

CRITICAL: Requirements updated - psycopg2-binary==2.9.11 must be installed for PostgreSQL support.
If ModuleNotFoundError: No module named 'psycopg2' occurs, Render's git checkout is stale.
Force-trigger a complete rebuild to refresh the cached repository.
"""

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from .app.core.config import settings
from .app.core.database import engine, Base
from .app.api import auth, prompts, snippets, dashboard, settings as settings_routes
from .app.api import execute, suggestions, taxonomy, models as models_routes

# CORS configuration - hardcoded to avoid environment variable issues
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3100",
    "https://promptoria-dev.vercel.app",
    "https://promptoria.vercel.app",
]

# Create all database tables (only if database is available)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    # Database may not be available in development, that's OK
    import warnings
    warnings.warn(f"Could not create database tables: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="PromptArchitect API",
    description="Backend API for PromptArchitect - migrated from Node.js",
    version="2.0.0"
)

# Include routers BEFORE adding middleware
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(prompts.router, prefix="/api/prompts", tags=["prompts"])
app.include_router(snippets.router, prefix="/api/snippets", tags=["snippets"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(settings_routes.router, prefix="/api/settings", tags=["settings"])
app.include_router(execute.router, prefix="/api/execute", tags=["execute"])
app.include_router(suggestions.router, prefix="/api/suggestions", tags=["suggestions"])
app.include_router(taxonomy.router, prefix="/api/taxonomy", tags=["taxonomy"])
app.include_router(models_routes.router, prefix="/api/models", tags=["models"])

# Add CORS middleware
print(f"DEBUG: CORS origins configured: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=True,
    max_age=86400,
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "PromptArchitect API"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", "3100"))
    uvicorn.run(app, host="0.0.0.0", port=port)
