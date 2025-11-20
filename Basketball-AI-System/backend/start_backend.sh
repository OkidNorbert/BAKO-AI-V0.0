#!/bin/bash
# Start Basketball AI Backend Server

cd "$(dirname "$0")"

# Activate virtual environment
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please create it first:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

source venv/bin/activate

# Check if port 8000 is already in use
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 8000 is already in use. Killing existing process..."
    pkill -f "uvicorn app.main:app"
    sleep 2
fi

echo "🚀 Starting Basketball AI Backend..."
echo "   Backend will be available at: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Health Check: http://localhost:8000/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

