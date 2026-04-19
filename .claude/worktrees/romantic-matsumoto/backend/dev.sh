#!/bin/bash
# Development server startup script

echo "PromptArchitect API - Development Server"
echo "========================================"

# Set environment
export PYTHONPATH=.

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "ERROR: .env.local not found"
    echo "Copy .env.example to .env.local and configure"
    exit 1
fi

echo "Starting development server..."
echo "API will be available at: http://localhost:3100"
echo "Documentation at: http://localhost:3100/docs"
echo ""

# Run with uvicorn
python -m uvicorn main:app --reload --host 0.0.0.0 --port 3100
