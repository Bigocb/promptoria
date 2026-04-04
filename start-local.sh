#!/bin/bash
# Start both API and frontend locally

echo ""
echo "================================================================"
echo "  PromptArchitect Local Development Environment"
echo "================================================================"
echo ""
echo "This will start:"
echo "  - Python FastAPI backend on port 3100"
echo "  - Static frontend on port 3000"
echo ""
echo "Frontend:  http://localhost:3000"
echo "API Docs:  http://localhost:3100/docs"
echo ""

# Start backend in background
echo "Starting API backend..."
cd backend
python -m uvicorn main:app --reload --port 3100 &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend server
echo "Starting frontend server..."
echo "Serving static files from: .next/out"
cd ../.next/out
python -m http.server 3000

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
