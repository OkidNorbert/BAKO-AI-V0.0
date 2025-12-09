#!/bin/bash
# Backend Deployment Script for Bako Basketball AI System

set -e

cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Bako Backend Deployment${NC}"
echo "================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Virtual environment not found!${NC}"
    echo "   Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Verify imports
echo -e "${YELLOW}🔍 Verifying components...${NC}"
python3 -c "from app.api.websocket import router; print('✅ WebSocket router')" 2>/dev/null || echo -e "${RED}❌ WebSocket router failed${NC}"
python3 -c "from app.services.video_processor import VideoProcessor; print('✅ VideoProcessor')" 2>/dev/null || echo -e "${RED}❌ VideoProcessor failed${NC}"
python3 -c "from app.models.action_classifier import ActionClassifier; print('✅ ActionClassifier')" 2>/dev/null || echo -e "${RED}❌ ActionClassifier failed${NC}"

# Check if port 8000 is in use
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 8000 is in use. Stopping existing process...${NC}"
    pkill -f "uvicorn app.main:app" || true
    sleep 2
fi

# Check for trained model
if [ -d "../models/best_model" ] || [ -d "../models/videomae_model_20251124_210835" ]; then
    echo -e "${GREEN}✅ Fine-tuned model found${NC}"
else
    echo -e "${YELLOW}⚠️  No fine-tuned model found - will use pre-trained model${NC}"
fi

# Check GPU
if python3 -c "import torch; print('GPU:', torch.cuda.is_available())" 2>/dev/null | grep -q "GPU: True"; then
    echo -e "${GREEN}✅ GPU detected${NC}"
else
    echo -e "${YELLOW}⚠️  No GPU detected - will use CPU${NC}"
fi

echo ""
echo -e "${BLUE}📋 Live Analysis Endpoints:${NC}"
echo "   - WebSocket: ws://localhost:8000/ws/analyze"
echo "   - Health: http://localhost:8000/api/health"
echo "   - Docs: http://localhost:8000/docs"
echo ""

# Start backend
echo -e "${GREEN}🚀 Starting backend server...${NC}"
echo "   Press Ctrl+C to stop"
echo ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

