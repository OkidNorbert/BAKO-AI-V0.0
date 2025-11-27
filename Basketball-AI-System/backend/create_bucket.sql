-- ============================================
-- Create Supabase Storage Bucket for Videos
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- 1. Go to: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Navigate to SQL Editor
-- 4. Paste this SQL and click Run
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Verify the bucket was created
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'videos';

