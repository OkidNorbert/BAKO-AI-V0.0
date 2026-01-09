#!/bin/bash
# Quick Cloudflare Tunnel Setup for Bako Backend

set -e

cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Cloudflare Tunnel Quick Setup${NC}"
echo "================================"
echo ""

# Check if backend is running
if ! curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running on localhost:8000${NC}"
    echo "   Please start the backend first:"
    echo "   cd backend && ./deploy.sh"
    exit 1
fi

echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}⚠️  cloudflared not found. Installing...${NC}"
    
    # Check if binary exists in project
    if [ -f "../cloudflared-linux-amd64" ]; then
        echo "   Using existing binary..."
        chmod +x ../cloudflared-linux-amd64
        sudo cp ../cloudflared-linux-amd64 /usr/local/bin/cloudflared
    else
        echo "   Downloading cloudflared..."
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /tmp/cloudflared
        chmod +x /tmp/cloudflared
        sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
    fi
    
    echo -e "${GREEN}✅ cloudflared installed${NC}"
else
    echo -e "${GREEN}✅ cloudflared found${NC}"
fi

echo ""
echo -e "${BLUE}Choose setup option:${NC}"
echo "1. Quick test (temporary URL - good for testing)"
echo "2. Permanent setup (requires authentication)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" == "1" ]; then
    echo ""
    echo -e "${YELLOW}Starting temporary tunnel...${NC}"
    echo "   This will give you a URL like: https://xxx.trycloudflare.com"
    echo "   Press Ctrl+C to stop"
    echo ""
    cloudflared tunnel --url http://localhost:8000
    
elif [ "$choice" == "2" ]; then
    echo ""
    echo -e "${YELLOW}Setting up permanent tunnel...${NC}"
    echo ""
    
    # Check if already authenticated
    if [ ! -f ~/.cloudflared/cert.pem ]; then
        echo "Step 1: Authenticate with Cloudflare"
        echo "   This will open a browser window..."
        cloudflared tunnel login
    else
        echo -e "${GREEN}✅ Already authenticated${NC}"
    fi
    
    # Check if tunnel exists
    if ! cloudflared tunnel list 2>/dev/null | grep -q "basketball-ai"; then
        echo ""
        echo "Step 2: Creating tunnel..."
        TUNNEL_OUTPUT=$(cloudflared tunnel create basketball-ai 2>&1)
        echo "$TUNNEL_OUTPUT"
        
        # Extract tunnel ID
        TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oP 'Created tunnel basketball-ai with id \K[^\s]+' || echo "")
        
        if [ -z "$TUNNEL_ID" ]; then
            echo -e "${RED}❌ Could not extract tunnel ID${NC}"
            echo "   Please run manually: cloudflared tunnel create basketball-ai"
            exit 1
        fi
        
        echo -e "${GREEN}✅ Tunnel created: $TUNNEL_ID${NC}"
    else
        echo -e "${GREEN}✅ Tunnel 'basketball-ai' already exists${NC}"
        TUNNEL_ID=$(cloudflared tunnel list 2>/dev/null | grep "basketball-ai" | awk '{print $1}')
    fi
    
    # Create config directory
    mkdir -p ~/.cloudflared
    
    # Create config file
    echo ""
    echo "Step 3: Creating config file..."
    cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /home/student/.cloudflared/$TUNNEL_ID.json

ingress:
  # Backend API
  - service: http://localhost:8000
  
  # Catch-all rule (must be last)
  - service: http_status:404
EOF
    
    echo -e "${GREEN}✅ Config created at ~/.cloudflared/config.yml${NC}"
    
    echo ""
    echo -e "${BLUE}Step 4: Starting tunnel...${NC}"
    echo "   Press Ctrl+C to stop"
    echo ""
    cloudflared tunnel --config ~/.cloudflared/config.yml run basketball-ai
    
else
    echo -e "${RED}Invalid choice${NC}"
    exit 1
fi

