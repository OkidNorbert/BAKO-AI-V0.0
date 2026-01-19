-- ============================================
-- Create Analysis Results Table in Supabase
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This will create the table to store analysis results
-- ============================================

-- 1. Create Table for Analysis Results
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

-- 2. Enable Row Level Security (Optional - for public access, you may want to disable this)
-- ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy to Allow Public Read (if RLS is enabled)
-- DROP POLICY IF EXISTS "Allow public read access" ON analysis_results;
-- CREATE POLICY "Allow public read access"
-- ON analysis_results
-- FOR SELECT
-- USING (true);

-- 4. Create Policy to Allow Public Insert (if RLS is enabled)
-- DROP POLICY IF EXISTS "Allow public insert" ON analysis_results;
-- CREATE POLICY "Allow public insert"
-- ON analysis_results
-- FOR INSERT
-- WITH CHECK (true);

-- 5. Verify table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'analysis_results'
ORDER BY ordinal_position;

