-- Migration: 005_update_analysis_results_columns.sql
-- Description: Adds team-specific stats to analysis_results table
-- Date: 2026-02-26

-- Add team-specific pass columns
ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS team_1_passes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_2_passes INTEGER DEFAULT 0;

-- Add team-specific interception columns
ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS team_1_interceptions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_2_interceptions INTEGER DEFAULT 0;

-- Optional: Comments for documentation
COMMENT ON COLUMN analysis_results.team_1_passes IS 'Number of successful passes by Team 1';
COMMENT ON COLUMN analysis_results.team_2_passes IS 'Number of successful passes by Team 2';
COMMENT ON COLUMN analysis_results.team_1_interceptions IS 'Number of interceptions made by Team 1';
COMMENT ON COLUMN analysis_results.team_2_interceptions IS 'Number of interceptions made by Team 2';
