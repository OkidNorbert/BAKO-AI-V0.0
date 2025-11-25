#!/bin/bash
# Start Basketball AI Backend Server

echo "🏀 Starting Basketball AI Backend..."
echo "=================================="

cd /home/student/Documents/Final-Year-Project/Basketball-AI-System/backend

# Activate virtual environment
source venv/bin/activate

# Check GPU availability
echo ""
echo "🔍 Checking GPU availability..."
python -c "import torch; print(f'✅ GPU Available: {torch.cuda.is_available()}'); print(f'   GPU Name: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"N/A\"}')"

echo ""
echo "🚀 Starting FastAPI server on http://0.0.0.0:8000"
echo "   Press Ctrl+C to stop"
echo ""

# Start the server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
