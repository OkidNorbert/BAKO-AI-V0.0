-- Verify the bucket was created
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'videos';
