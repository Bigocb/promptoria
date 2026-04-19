@echo off
REM Start both API and frontend locally

title PromptArchitect - Local Development

echo.
echo ================================================================
echo  PromptArchitect Local Development Environment
echo ================================================================
echo.
echo This will start:
echo   - Python FastAPI backend on port 3100
echo   - Static frontend on port 3000
echo.
echo Frontend:  http://localhost:3000
echo API Docs:  http://localhost:3100/docs
echo.

REM Start backend in new window
echo Starting API backend...
start cmd /k "cd backend && python -m uvicorn main:app --reload --port 3100"

REM Wait a bit for backend to start
timeout /t 2 /nobreak

REM Start frontend server
echo Starting frontend server...
echo Serving static files from: .next/out
cd .next/out
python -m http.server 3000
