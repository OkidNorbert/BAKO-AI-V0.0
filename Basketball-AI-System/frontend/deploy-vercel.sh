#!/bin/bash
# Deploy Frontend to Vercel with Cloudflare Backend URL

set -e

cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Frontend to Vercel${NC}"
echo "================================"
echo ""

# Get Cloudflare URL (if provided as argument)
CLOUDFLARE_URL="${1:-https://efficiency-prince-demands-puzzle.trycloudflare.com}"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   Backend URL: $CLOUDFLARE_URL"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "   Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if logged in to Vercel
if ! vercel whoami &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    echo "   Please log in..."
    vercel login
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Build frontend
echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Set environment variable for deployment
export VITE_API_URL="$CLOUDFLARE_URL"

echo -e "${YELLOW}🌐 Setting Vercel environment variables...${NC}"
vercel env add VITE_API_URL production <<< "$CLOUDFLARE_URL" 2>/dev/null || \
vercel env rm VITE_API_URL production --yes 2>/dev/null && \
vercel env add VITE_API_URL production <<< "$CLOUDFLARE_URL"

# Also set for preview and development
vercel env add VITE_API_URL preview <<< "$CLOUDFLARE_URL" 2>/dev/null || true
vercel env add VITE_API_URL development <<< "$CLOUDFLARE_URL" 2>/dev/null || true

echo -e "${GREEN}✅ Environment variables set${NC}"
echo ""

# Deploy to Vercel
echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"
echo "   This may take a few minutes..."
echo ""

vercel --prod --yes

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Check your Vercel dashboard for the deployment URL"
echo "   2. Verify the frontend connects to backend at: $CLOUDFLARE_URL"
echo "   3. Test live analysis feature"
echo ""

