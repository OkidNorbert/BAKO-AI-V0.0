-- Migration: Add has_annotated column to videos table
-- Description: Records whether an annotated version of the video exists on disk.

-- Add the column
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS has_annotated BOOLEAN DEFAULT FALSE;

-- Update existing records if possible (though we should do this via a sync script)
-- For now, initialize all existing ones to false
UPDATE videos SET has_annotated = FALSE WHERE has_annotated IS NULL;
