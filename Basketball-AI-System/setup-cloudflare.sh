#!/bin/bash
# Interactive Cloudflare Tunnel Setup Script

set -e

echo "🌐 Cloudflare Tunnel Setup for Basketball AI"
echo "============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}⚠️  cloudflared not found. Installing...${NC}"
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /tmp/cloudflared
    chmod +x /tmp/cloudflared
    sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
    echo -e "${GREEN}✅ cloudflared installed${NC}"
    echo ""
fi

# Step 1: Authenticate
echo -e "${BLUE}Step 1: Authenticate with Cloudflare${NC}"
echo "This will open a browser window..."
read -p "Press Enter to continue..."
cloudflared tunnel login

echo ""
echo -e "${GREEN}✅ Authentication complete!${NC}"
echo ""

# Step 2: Create Tunnel
echo -e "${BLUE}Step 2: Create Tunnel${NC}"
read -p "Enter tunnel name (default: basketball-ai): " TUNNEL_NAME
TUNNEL_NAME=${TUNNEL_NAME:-basketball-ai}

echo "Creating tunnel: $TUNNEL_NAME"
TUNNEL_OUTPUT=$(cloudflared tunnel create "$TUNNEL_NAME" 2>&1)
echo "$TUNNEL_OUTPUT"

# Extract tunnel ID
TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oP 'Created tunnel \K[^\s]+' || echo "")
if [ -z "$TUNNEL_ID" ]; then
    echo -e "${YELLOW}⚠️  Could not extract tunnel ID automatically${NC}"
    echo "Please enter the tunnel ID manually:"
    read -p "Tunnel ID: " TUNNEL_ID
fi

echo ""
echo -e "${GREEN}✅ Tunnel created!${NC}"
echo -e "   Tunnel ID: ${BLUE}$TUNNEL_ID${NC}"
echo ""

# Step 3: Domain Setup
echo -e "${BLUE}Step 3: Domain Setup${NC}"
echo "Choose an option:"
echo "1) Use your own domain (e.g., api.yourdomain.com)"
echo "2) Use Cloudflare's free subdomain (temporary URL)"
read -p "Enter choice (1 or 2): " DOMAIN_CHOICE

if [ "$DOMAIN_CHOICE" = "1" ]; then
    read -p "Enter your domain (e.g., yourdomain.com): " DOMAIN
    read -p "Enter subdomain for API (default: api): " SUBDOMAIN
    SUBDOMAIN=${SUBDOMAIN:-api}
    FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"
    
    echo "Creating DNS record: $FULL_DOMAIN"
    cloudflared tunnel route dns "$TUNNEL_NAME" "$FULL_DOMAIN"
    
    HOSTNAME="$FULL_DOMAIN"
    echo -e "${GREEN}✅ DNS record created!${NC}"
    echo -e "   Your API will be at: ${BLUE}https://$FULL_DOMAIN${NC}"
else
    HOSTNAME=""
    echo -e "${YELLOW}⚠️  Using temporary URL (changes each restart)${NC}"
    echo "   For permanent setup, use option 1 with your own domain"
fi

echo ""

# Step 4: Create Config File
echo -e "${BLUE}Step 4: Create Configuration File${NC}"
CONFIG_DIR="$HOME/.cloudflared"
CONFIG_FILE="$CONFIG_DIR/config.yml"
CREDENTIALS_FILE="$CONFIG_DIR/${TUNNEL_ID}.json"

mkdir -p "$CONFIG_DIR"

# Check if credentials file exists
if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo -e "${YELLOW}⚠️  Credentials file not found at: $CREDENTIALS_FILE${NC}"
    echo "   It should have been created automatically."
    echo "   Please verify the tunnel ID is correct."
fi

# Create config file
cat > "$CONFIG_FILE" << EOF
tunnel: $TUNNEL_ID
credentials-file: $CREDENTIALS_FILE

ingress:
EOF

if [ -n "$HOSTNAME" ]; then
    cat >> "$CONFIG_FILE" << EOF
  - hostname: $HOSTNAME
    service: http://localhost:8000
EOF
else
    cat >> "$CONFIG_FILE" << EOF
  - service: http://localhost:8000
EOF
fi

cat >> "$CONFIG_FILE" << EOF
  - service: http_status:404
EOF

chmod 600 "$CONFIG_FILE"

echo -e "${GREEN}✅ Configuration file created!${NC}"
echo -e "   Location: ${BLUE}$CONFIG_FILE${NC}"
echo ""

# Step 5: Test Configuration
echo -e "${BLUE}Step 5: Test Configuration${NC}"
echo "Checking if backend is running..."
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend is not running${NC}"
    echo "   Start it with: cd backend && source venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
fi
echo ""

# Step 6: Summary
echo "============================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "============================================="
echo ""
echo "📋 Summary:"
echo "   Tunnel Name: $TUNNEL_NAME"
echo "   Tunnel ID: $TUNNEL_ID"
if [ -n "$HOSTNAME" ]; then
    echo "   API URL: https://$HOSTNAME"
else
    echo "   API URL: (temporary - use 'cloudflared tunnel --url http://localhost:8000' for testing)"
fi
echo "   Config File: $CONFIG_FILE"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start backend: cd backend && source venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo "   2. Start tunnel: cloudflared tunnel --config $CONFIG_FILE run $TUNNEL_NAME"
echo "   3. Update Vercel env var: VITE_API_URL=https://$HOSTNAME (or your tunnel URL)"
echo ""
echo "📖 For auto-start on boot, see DEPLOYMENT.md"
echo ""

