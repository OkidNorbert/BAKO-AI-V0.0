-- ============================================
-- Setup Storage Policies for Videos Bucket
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This will allow public uploads and reads to the 'videos' bucket
-- ============================================

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create policy to allow public SELECT (read) access
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'videos');

-- 3. Create policy to allow public INSERT (upload) access
CREATE POLICY "Allow public upload"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'videos');

-- 4. Create policy to allow public UPDATE (overwrite) access
CREATE POLICY "Allow public update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'videos')
WITH CHECK (bucket_id = 'videos');

-- 5. Create policy to allow public DELETE access (optional, for cleanup)
CREATE POLICY "Allow public delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'videos');

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

