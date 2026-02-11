-- Rollback script for Advanced Analytics Migration 001
-- This script safely removes all advanced analytics tables
-- Run this if you need to rollback the migration

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS auto_clips CASCADE;
DROP TABLE IF EXISTS fatigue_index CASCADE;
DROP TABLE IF EXISTS lineup_metrics CASCADE;
DROP TABLE IF EXISTS decision_analysis CASCADE;
DROP TABLE IF EXISTS transition_effort CASCADE;
DROP TABLE IF EXISTS defensive_reactions CASCADE;
DROP TABLE IF EXISTS spacing_metrics CASCADE;
DROP TABLE IF EXISTS possessions CASCADE;

-- Note: This does NOT affect any existing tables or data
-- All original functionality remains intact
