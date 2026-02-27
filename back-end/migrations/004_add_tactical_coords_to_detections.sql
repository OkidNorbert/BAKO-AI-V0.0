-- Add tactical coordinate columns to detections table
ALTER TABLE detections
ADD COLUMN IF NOT EXISTS tactical_x FLOAT,
ADD COLUMN IF NOT EXISTS tactical_y FLOAT;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS detections_video_id_frame_idx ON detections(video_id, frame);

-- If data already exists in keypoints, prioritize it but keep columns for future
-- (Optional: migrate existing data if needed)
-- UPDATE detections SET tactical_x = (keypoints->>'tactical_x')::float WHERE keypoints->>'tactical_x' IS NOT NULL;
-- UPDATE detections SET tactical_y = (keypoints->>'tactical_y')::float WHERE keypoints->>'tactical_y' IS NOT NULL;
