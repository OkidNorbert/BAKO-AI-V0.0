-- Advanced Analytics Schema Migration
-- Version: 001
-- Description: Adds 7 new tables for advanced basketball analytics
-- Date: 2026-02-11
-- IMPORTANT: This is ADDITIVE ONLY - no modifications to existing tables

-- ============================================
-- POSSESSIONS TABLE
-- ============================================
-- Segments game by offensive/defensive possessions
CREATE TABLE IF NOT EXISTS possessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    start_frame INTEGER NOT NULL,
    end_frame INTEGER NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    offense_team INTEGER NOT NULL CHECK (offense_team IN (1, 2)),
    defense_team INTEGER NOT NULL CHECK (defense_team IN (1, 2)),
    lineup_ids INTEGER[] NOT NULL,  -- Array of player track IDs on offense
    outcome TEXT,  -- 'score', 'turnover', 'defensive_stop', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_possessions_video ON possessions(video_id);
CREATE INDEX idx_possessions_frames ON possessions(video_id, start_frame, end_frame);

-- ============================================
-- SPACING METRICS TABLE
-- ============================================
-- Per-possession spacing quality analysis
CREATE TABLE IF NOT EXISTS spacing_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    possession_id UUID NOT NULL REFERENCES possessions(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    frame INTEGER NOT NULL,
    timestamp REAL NOT NULL,
    spacing_quality TEXT NOT NULL CHECK (spacing_quality IN ('good', 'average', 'poor')),
    avg_distance_m REAL NOT NULL,
    paint_players INTEGER NOT NULL DEFAULT 0,
    overlap_count INTEGER NOT NULL DEFAULT 0,
    player_positions JSONB,  -- Store actual positions for debugging
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spacing_possession ON spacing_metrics(possession_id);
CREATE INDEX idx_spacing_video ON spacing_metrics(video_id);
CREATE INDEX idx_spacing_quality ON spacing_metrics(video_id, spacing_quality);

-- ============================================
-- DEFENSIVE REACTIONS TABLE
-- ============================================
-- Tracks defensive reaction times and closeout speeds
CREATE TABLE IF NOT EXISTS defensive_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,  -- Reference to event in analysis_results.events JSONB
    event_type TEXT NOT NULL,  -- 'shot', 'pass', 'drive'
    event_frame INTEGER NOT NULL,
    defender_track_id INTEGER NOT NULL,
    offensive_player_track_id INTEGER NOT NULL,
    reaction_start_frame INTEGER,
    reaction_delay_ms REAL,
    closeout_speed_mps REAL,
    late_closeout BOOLEAN DEFAULT FALSE,
    distance_at_event REAL,  -- Defender distance when event occurred
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_defensive_reactions_video ON defensive_reactions(video_id);
CREATE INDEX idx_defensive_reactions_event ON defensive_reactions(video_id, event_id);
CREATE INDEX idx_defensive_reactions_late ON defensive_reactions(video_id, late_closeout);

-- ============================================
-- TRANSITION EFFORT TABLE
-- ============================================
-- Tracks player effort during transition (offense to defense, defense to offense)
CREATE TABLE IF NOT EXISTS transition_effort (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    possession_id UUID NOT NULL REFERENCES possessions(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    player_track_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL CHECK (team_id IN (1, 2)),
    transition_type TEXT NOT NULL CHECK (transition_type IN ('offense_to_defense', 'defense_to_offense')),
    effort_type TEXT NOT NULL CHECK (effort_type IN ('sprint', 'jog', 'walk')),
    max_speed_mps REAL NOT NULL,
    avg_speed_mps REAL NOT NULL,
    effort_score REAL NOT NULL CHECK (effort_score >= 0 AND effort_score <= 100),
    duration_seconds REAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transition_possession ON transition_effort(possession_id);
CREATE INDEX idx_transition_video ON transition_effort(video_id);
CREATE INDEX idx_transition_player ON transition_effort(video_id, player_track_id);
CREATE INDEX idx_transition_effort_type ON transition_effort(video_id, effort_type);

-- ============================================
-- DECISION ANALYSIS TABLE
-- ============================================
-- Analyzes shot decision quality based on shooter vs. teammate openness
CREATE TABLE IF NOT EXISTS decision_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,  -- Reference to shot event
    shot_frame INTEGER NOT NULL,
    shooter_track_id INTEGER NOT NULL,
    shooter_contested_distance REAL NOT NULL,  -- Distance to nearest defender
    open_teammates INTEGER NOT NULL DEFAULT 0,  -- Count of teammates with defender > 2.5m
    best_teammate_openness REAL,  -- Distance to defender for most open teammate
    decision_quality TEXT NOT NULL CHECK (decision_quality IN ('high_expected_value', 'acceptable', 'low_expected_value')),
    teammate_positions JSONB,  -- Store teammate openness data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decision_video ON decision_analysis(video_id);
CREATE INDEX idx_decision_event ON decision_analysis(video_id, event_id);
CREATE INDEX idx_decision_quality ON decision_analysis(video_id, decision_quality);

-- ============================================
-- LINEUP METRICS TABLE
-- ============================================
-- Tracks performance of specific 5-player combinations
CREATE TABLE IF NOT EXISTS lineup_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL CHECK (team_id IN (1, 2)),
    lineup_hash TEXT NOT NULL,  -- Sorted player track IDs as string (e.g., "1_3_5_7_9")
    player_track_ids INTEGER[] NOT NULL,  -- Array of 5 player track IDs
    possessions_count INTEGER NOT NULL DEFAULT 0,
    points_scored INTEGER NOT NULL DEFAULT 0,
    points_allowed INTEGER NOT NULL DEFAULT 0,
    offensive_rating REAL,  -- Points per 100 possessions
    defensive_rating REAL,  -- Points allowed per 100 possessions
    net_rating REAL,  -- Offensive - Defensive rating
    avg_spacing_score REAL,
    turnovers INTEGER NOT NULL DEFAULT 0,
    defensive_error_rate REAL,  -- Late closeouts / total defensive events
    total_minutes REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(video_id, team_id, lineup_hash)
);

CREATE INDEX idx_lineup_video ON lineup_metrics(video_id);
CREATE INDEX idx_lineup_team ON lineup_metrics(video_id, team_id);
CREATE INDEX idx_lineup_hash ON lineup_metrics(lineup_hash);
CREATE INDEX idx_lineup_net_rating ON lineup_metrics(video_id, net_rating);

-- ============================================
-- FATIGUE INDEX TABLE
-- ============================================
-- Tracks player fatigue indicators over time
CREATE TABLE IF NOT EXISTS fatigue_index (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    player_track_id INTEGER NOT NULL,
    time_window_start REAL NOT NULL,  -- Start time in seconds
    time_window_end REAL NOT NULL,  -- End time in seconds
    minute INTEGER NOT NULL,  -- Game minute (for easy querying)
    baseline_speed_mps REAL NOT NULL,  -- Early game average speed
    current_speed_mps REAL NOT NULL,  -- Current window average speed
    speed_drop_percentage REAL NOT NULL,
    baseline_reaction_ms REAL,  -- Early game average reaction time
    current_reaction_ms REAL,  -- Current window average reaction time
    reaction_delay_increase_percentage REAL,
    fatigue_level TEXT NOT NULL CHECK (fatigue_level IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fatigue_video ON fatigue_index(video_id);
CREATE INDEX idx_fatigue_player ON fatigue_index(video_id, player_track_id);
CREATE INDEX idx_fatigue_minute ON fatigue_index(video_id, minute);
CREATE INDEX idx_fatigue_level ON fatigue_index(video_id, fatigue_level);

-- ============================================
-- AUTO CLIPS TABLE
-- ============================================
-- Metadata for automatically generated coaching clips
CREATE TABLE IF NOT EXISTS auto_clips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    clip_type TEXT NOT NULL CHECK (clip_type IN (
        'poor_spacing', 
        'late_rotation', 
        'low_decision_quality', 
        'poor_transition',
        'excellent_spacing',
        'quick_rotation',
        'high_effort_transition'
    )),
    timestamp_start REAL NOT NULL,  -- Start time in seconds
    timestamp_end REAL NOT NULL,  -- End time in seconds
    frame_start INTEGER NOT NULL,
    frame_end INTEGER NOT NULL,
    players_involved INTEGER[] NOT NULL,  -- Track IDs of key players
    file_path TEXT NOT NULL,  -- Relative path to clip file
    description TEXT,  -- Auto-generated description
    metadata JSONB,  -- Additional context (spacing score, reaction delay, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clips_video ON auto_clips(video_id);
CREATE INDEX idx_clips_type ON auto_clips(video_id, clip_type);
CREATE INDEX idx_clips_timestamp ON auto_clips(video_id, timestamp_start);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE possessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spacing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE defensive_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transition_effort ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatigue_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_clips ENABLE ROW LEVEL SECURITY;

-- All tables: users can only access data for videos they own
CREATE POLICY "Users can view own possessions" ON possessions
    FOR SELECT USING (
        video_id IN (SELECT id FROM videos WHERE uploader_id::text = auth.uid()::text)
    );

CREATE POLICY "Users can view own spacing metrics" ON spacing_metrics
    FOR SELECT USING (
        video_id IN (SELECT id FROM videos WHERE uploader_id::text = auth.uid()::text)
    );

CREATE POLICY "Users can view own defensive reactions" ON defensive_reactions
    FOR SELECT USING (
        video_id IN (SELECT id FROM videos WHERE uploader_id::text = auth.uid()::text)
    );

CREATE POLICY "Users can view own transition effort" ON transition_effort
    FOR SELECT USING (
        video_id IN (SELECT id FROM videos WHERE uploader_id::text = auth.uid()::text)
    );

CREATE POLICY "Users can view own decision analysis" ON decision_analysis
    FOR SELECT USING (
        video_id IN (SELECT id FROM videos WHERE uploader_id::text = auth.uid()::text)
    );

CREATE POLICY "Users can view own lineup metrics" ON lineup_metrics
    FOR SELECT USING (
        video_id IN (SELECT id FROM videos WHERE uploader_id::text = auth.uid()::text)
    );

CREATE POLICY "Users can view own fatigue index" ON fatigue_index
    FOR SELECT USING (
        video_id IN (SELECT id FROM videos WHERE uploader_id::text = auth.uid()::text)
    );

CREATE POLICY "Users can view own auto clips" ON auto_clips
    FOR SELECT USING (
        video_id IN (SELECT id FROM videos WHERE uploader_id::text = auth.uid()::text)
    );

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE possessions IS 'Segments game footage into offensive/defensive possessions with lineup tracking';
COMMENT ON TABLE spacing_metrics IS 'Per-frame offensive spacing quality analysis';
COMMENT ON TABLE defensive_reactions IS 'Defensive reaction times and closeout speeds for all defensive events';
COMMENT ON TABLE transition_effort IS 'Player effort classification during transition phases';
COMMENT ON TABLE decision_analysis IS 'Shot decision quality based on shooter vs. teammate openness';
COMMENT ON TABLE lineup_metrics IS 'Performance metrics for specific 5-player combinations';
COMMENT ON TABLE fatigue_index IS 'Player fatigue indicators tracked over time windows';
COMMENT ON TABLE auto_clips IS 'Metadata for automatically generated coaching highlight clips';
