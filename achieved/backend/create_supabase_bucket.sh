#!/bin/bash
# Script to create Supabase storage bucket for videos
# Requires SUPABASE_URL and SUPABASE_KEY environment variables

# Load credentials from environment variables
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_KEY="${SUPABASE_KEY:-}"
BUCKET_NAME="videos"

# Validate credentials are provided
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "❌ Supabase credentials not found!"
    echo "   Please set SUPABASE_URL and SUPABASE_KEY environment variables:"
    echo "   export SUPABASE_URL='https://your-project.supabase.co'"
    echo "   export SUPABASE_KEY='your-anon-key'"
    exit 1
fi

echo "🚀 Creating Supabase storage bucket '$BUCKET_NAME'..."
echo "   Project URL: $SUPABASE_URL"

# Create bucket using curl
response=$(curl -s -w "\n%{http_code}" -X POST \
  "$SUPABASE_URL/storage/v1/bucket" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$BUCKET_NAME\",
    \"name\": \"$BUCKET_NAME\",
    \"public\": true
  }")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo "✅ Successfully created bucket '$BUCKET_NAME'!"
    exit 0
elif [ "$http_code" = "409" ]; then
    echo "✅ Bucket '$BUCKET_NAME' already exists!"
    exit 0
else
    echo "⚠️  API returned status $http_code"
    echo "   Response: $body"
    echo ""
    echo "📝 Alternative: Create bucket using SQL"
    echo "   1. Go to https://supabase.com/dashboard"
    echo "   2. Select your project"
    echo "   3. Go to SQL Editor"
    echo "   4. Run this SQL:"
    echo "   INSERT INTO storage.buckets (id, name, public)"
    echo "   VALUES ('$BUCKET_NAME', '$BUCKET_NAME', true)"
    echo "   ON CONFLICT (id) DO NOTHING;"
    exit 1
fi

