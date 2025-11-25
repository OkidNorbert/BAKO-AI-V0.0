#!/bin/bash
# Start Cloudflare Tunnel (Quick Setup - Temporary URL)

echo "🌐 Starting Cloudflare Tunnel (Quick Setup)"
echo "==========================================="
echo ""
echo "⚠️  This creates a TEMPORARY tunnel URL that changes each time."
echo "   For a permanent URL, use the permanent setup option."
echo ""
echo "📝 Copy the tunnel URL (https://....trycloudflare.com) when it appears"
echo "   You'll need to add this to Vercel's VITE_API_URL environment variable"
echo ""
echo "🚀 Starting tunnel..."
echo ""

cloudflared tunnel --url http://localhost:8000
