#!/bin/bash
# Quick deployment script for Basketball AI System

set -e

echo "🚀 Basketball AI Deployment Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root${NC}"
   exit 1
fi

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}⚠️  cloudflared not found. Installing...${NC}"
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /tmp/cloudflared
    chmod +x /tmp/cloudflared
    sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
    echo -e "${GREEN}✅ cloudflared installed${NC}"
fi

# Check if backend is running
if ! curl -s http://localhost:8000/api/health > /dev/null; then
    echo -e "${YELLOW}⚠️  Backend not running. Starting...${NC}"
    cd "$(dirname "$0")/backend"
    source venv/bin/activate
    nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
    echo -e "${GREEN}✅ Backend started${NC}"
    sleep 3
fi

# Check tunnel status
if systemctl is-active --quiet cloudflared-tunnel; then
    echo -e "${GREEN}✅ Cloudflare tunnel is running${NC}"
else
    echo -e "${YELLOW}⚠️  Cloudflare tunnel not running${NC}"
    echo "   Run: sudo systemctl start cloudflared-tunnel"
fi

# Check GPU
if command -v nvidia-smi &> /dev/null; then
    echo -e "${GREEN}✅ GPU detected${NC}"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
else
    echo -e "${YELLOW}⚠️  No GPU detected (will use CPU)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment check complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Ensure Cloudflare tunnel is configured"
echo "   2. Deploy frontend to Vercel"
echo "   3. Update environment variables"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"

