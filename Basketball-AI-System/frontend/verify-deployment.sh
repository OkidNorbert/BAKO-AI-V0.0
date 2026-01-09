#!/bin/bash
# Verify Frontend Deployment Configuration

set -e

cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verifying Frontend Deployment${NC}"
echo "================================"
echo ""

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    exit 1
fi

# Check if logged in
if ! vercel whoami &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    vercel login
fi

echo -e "${YELLOW}📋 Current Environment Variables:${NC}"
vercel env ls 2>&1 | grep -E "(VITE_API_URL|Name|Value)" || echo "   No environment variables found"

echo ""
echo -e "${YELLOW}🌐 Testing Backend Connection:${NC}"

BACKEND_URL="${1:-https://efficiency-prince-demands-puzzle.trycloudflare.com}"

echo "   Testing: $BACKEND_URL/api/health"
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/health" || echo "ERROR")

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}   ✅ Backend is accessible${NC}"
else
    echo -e "${RED}   ❌ Backend is not accessible${NC}"
    echo "   Response: $HEALTH_RESPONSE"
fi

echo ""
echo -e "${BLUE}📝 To Set/Update Environment Variable:${NC}"
echo "   vercel env add VITE_API_URL production"
echo "   (Enter: $BACKEND_URL)"
echo ""
echo -e "${BLUE}🔄 To Redeploy After Setting Env Var:${NC}"
echo "   vercel --prod --yes"

