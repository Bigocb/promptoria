@echo off
REM Development server startup script for Windows

echo PromptArchitect API - Development Server
echo ========================================

REM Check if .env.local exists
if not exist ".env.local" (
    echo ERROR: .env.local not found
    echo Copy .env.example to .env.local and configure
    exit /b 1
)

echo Starting development server...
echo API will be available at: http://localhost:3100
echo Documentation at: http://localhost:3100/docs
echo.

REM Run with uvicorn
python -m uvicorn main:app --reload --host 0.0.0.0 --port 3100
