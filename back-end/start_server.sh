#!/bin/bash

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run FastAPI server
echo "Starting Backend Server..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
