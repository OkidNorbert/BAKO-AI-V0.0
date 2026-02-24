-- Supabase Database Schema for Basketball Analysis Platform
-- Run these in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('team', 'personal', 'coach')),
    full_name TEXT,
    avatar_url TEXT,
    organization_id UUID, -- Explicitly added for linking to orgs
    staff_role TEXT, -- e.g., 'Main Coach', 'Assistant Coach'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- ORGANIZATIONS TABLE (TEAM accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#FF5733',
    secondary_color TEXT DEFAULT '#333333',
    jersey_style TEXT DEFAULT 'Solid',
    home_court TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    twitter_handle TEXT,
    instagram_handle TEXT,
    competition_settings JSONB DEFAULT '{}',
    roster_settings JSONB DEFAULT '{}',
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_owner ON organizations(owner_id);

-- ============================================
-- PLAYERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    jersey_number INTEGER,
    position TEXT,
    height_cm REAL,
    weight_kg REAL,
    date_of_birth DATE,
    avatar_url TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_org ON players(organization_id);
CREATE INDEX idx_players_user ON players(user_id);

-- ============================================
-- VIDEOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    analysis_mode TEXT NOT NULL CHECK (analysis_mode IN ('team', 'personal')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    storage_path TEXT NOT NULL,
    duration_seconds REAL,
    frame_count INTEGER,
    fps REAL,
    width INTEGER,
    height INTEGER,
    file_size_bytes BIGINT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    error_message TEXT,
    progress_percent REAL,
    current_step TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_videos_uploader ON videos(uploader_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_org ON videos(organization_id);

-- ============================================
-- DETECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    frame INTEGER NOT NULL,
    object_type TEXT NOT NULL CHECK (object_type IN ('player', 'ball')),
    track_id INTEGER NOT NULL,
    bbox REAL[] NOT NULL,
    confidence REAL NOT NULL,
    keypoints JSONB,
    team_id INTEGER,
    has_ball BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_detections_video ON detections(video_id);
CREATE INDEX idx_detections_frame ON detections(video_id, frame);

-- ============================================
-- ANALYSIS RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    total_frames INTEGER NOT NULL,
    duration_seconds REAL NOT NULL,
    players_detected INTEGER,
    
    -- Team analysis specific
    team_1_possession_percent REAL,
    team_2_possession_percent REAL,
    total_passes INTEGER,
    total_interceptions INTEGER,
    defensive_actions INTEGER,
    
    -- Personal analysis specific
    shot_attempts INTEGER,
    overall_shooting_percentage REAL,
    shot_form_consistency REAL,
    dribble_count INTEGER,
    dribble_frequency_per_minute REAL,
    total_distance_meters REAL,
    avg_speed_kmh REAL,
    max_speed_kmh REAL,
    acceleration_events INTEGER,
    avg_knee_bend_angle REAL,
    avg_elbow_angle_shooting REAL,
    training_load_score REAL,
    
    -- Events (stored as JSONB)
    events JSONB DEFAULT '[]',
    
    processing_time_seconds REAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_video ON analysis_results(video_id);

-- ============================================
-- ANALYTICS TABLE (time-series metrics)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    metric_type TEXT NOT NULL,
    value REAL NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_player ON analytics(player_id);
CREATE INDEX idx_analytics_type ON analytics(player_id, metric_type);
CREATE INDEX idx_analytics_video ON analytics(video_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING ((SELECT auth.uid())::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING ((SELECT auth.uid())::text = id::text);

-- Organizations: owners only
CREATE POLICY "Owners can manage organizations" ON organizations
    FOR ALL USING ((SELECT auth.uid())::text = owner_id::text);

-- Videos: uploaders only
CREATE POLICY "Uploaders can manage videos" ON videos
    FOR ALL USING ((SELECT auth.uid())::text = uploader_id::text);

-- Players: org owners or personal users
CREATE POLICY "Users can manage their players" ON players
    FOR ALL USING (
        (SELECT auth.uid())::text = user_id::text
        OR organization_id IN (
            SELECT id FROM organizations WHERE owner_id::text = (SELECT auth.uid())::text
        )
    );

-- Detections: via video ownership
CREATE POLICY "Users can view own detections" ON detections
    FOR SELECT USING (
        video_id IN (SELECT id FROM videos WHERE uploader_id::text = (SELECT auth.uid())::text)
    );

-- Analysis results: via video ownership
CREATE POLICY "Users can view own analysis" ON analysis_results
    FOR SELECT USING (
        video_id IN (SELECT id FROM videos WHERE uploader_id::text = (SELECT auth.uid())::text)
    );

-- Analytics: via player ownership
CREATE POLICY "Users can view own analytics" ON analytics
    FOR SELECT USING (
        player_id IN (
            SELECT id FROM players 
            WHERE user_id::text = (SELECT auth.uid())::text
            OR organization_id IN (
                SELECT id FROM organizations WHERE owner_id::text = (SELECT auth.uid())::text
            )
        )
    );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SCHEDULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL,
    location TEXT,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_schedules_org ON schedules(organization_id);

-- ============================================
-- MATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    opponent TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    location TEXT,
    result TEXT,
    score_us INTEGER,
    score_them INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_org ON matches(organization_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    action_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Schedules: viewable by org members (including owners)
CREATE POLICY "Users can view schedules" ON schedules
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM users WHERE id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM players WHERE user_id::text = (SELECT auth.uid())::text
        )
    );

CREATE POLICY "Owners and Staff can manage schedules" ON schedules
    FOR ALL WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM users WHERE id::text = (SELECT auth.uid())::text AND (account_type = 'team' OR account_type = 'coach')
        )
    );

-- Matches: similar to schedules
CREATE POLICY "Users can view matches" ON matches
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM users WHERE id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM players WHERE user_id::text = (SELECT auth.uid())::text
        )
    );

CREATE POLICY "Owners and Staff can manage matches" ON matches
    FOR ALL WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM users WHERE id::text = (SELECT auth.uid())::text AND (account_type = 'team' OR account_type = 'coach')
        )
    );

-- Announcements: viewable by org members
CREATE POLICY "Users can view announcements" ON announcements
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM users WHERE id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM players WHERE user_id::text = (SELECT auth.uid())::text
        )
    );

CREATE POLICY "Owners and Staff can manage announcements" ON announcements
    FOR ALL WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM users WHERE id::text = (SELECT auth.uid())::text AND (account_type = 'team' OR account_type = 'coach')
        )
    );

-- Notifications: generic
CREATE POLICY "Users can manage own notifications" ON notifications
    FOR ALL USING (recipient_id::text = (SELECT auth.uid())::text);
-- Triggers
CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_player ON activities(player_id);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Activities: viewable by self or org owner
CREATE POLICY "Users can view activities" ON activities
    FOR SELECT USING (
        player_id IN (
            SELECT id FROM players WHERE user_id::text = (SELECT auth.uid())::text
            OR organization_id IN (
                SELECT id FROM organizations WHERE owner_id::text = (SELECT auth.uid())::text
            )
        )
    );

CREATE POLICY "Players can manage own activities" ON activities
    FOR INSERT, UPDATE, DELETE WITH CHECK (
        player_id IN (
            SELECT id FROM players WHERE user_id::text = (SELECT auth.uid())::text
        )
    );
