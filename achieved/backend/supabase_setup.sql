-- ============================================
-- Supabase Setup for Basketball AI System
-- ============================================

-- 1. Create Storage Bucket for Videos
-- Go to Storage > Create a new bucket
-- Bucket name: videos
-- Public: Yes (or configure policies as needed)
-- You can also do this via SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Table for Analysis Results
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action TEXT,
    confidence FLOAT,
    metrics JSONB,
    recommendations JSONB,
    video_url TEXT,
    raw_result JSONB
);

-- 3. Enable Row Level Security (Optional)
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy to Allow Public Read (Optional)
CREATE POLICY "Allow public read access"
ON analysis_results
FOR SELECT
USING (true);

-- 5. Create Policy to Allow Authenticated Insert (Optional)
CREATE POLICY "Allow authenticated insert"
ON analysis_results
FOR INSERT
WITH CHECK (true);

-- ============================================
-- Instructions:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste this script and run it
-- 4. Verify the table and bucket were created
-- ============================================
