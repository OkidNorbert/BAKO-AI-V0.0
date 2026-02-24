-- Migration 002: Official Match Stats Import

-- 1. Ensure matches table has missing columns
ALTER TABLE matches ADD COLUMN IF NOT EXISTS competition TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 2. Create the match_stat_uploads table
CREATE TABLE IF NOT EXISTS match_stat_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('image', 'pdf')),
    extract_status TEXT DEFAULT 'queued' CHECK (extract_status IN ('queued', 'extracting', 'needs_review', 'confirmed', 'failed')),
    extracted_json JSONB,
    confidence NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_stat_uploads_match ON match_stat_uploads(match_id);
CREATE INDEX IF NOT EXISTS idx_match_stat_uploads_org ON match_stat_uploads(organization_id);

-- 3. Create the match_player_stats table
CREATE TABLE IF NOT EXISTS match_player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    player_profile_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    source TEXT DEFAULT 'official_upload' CHECK (source IN ('official_upload', 'manual')),
    -- Core stats
    mins TEXT,
    pts INTEGER DEFAULT 0,
    fgm INTEGER DEFAULT 0,
    fga INTEGER DEFAULT 0,
    tp_m INTEGER DEFAULT 0,
    tp_a INTEGER DEFAULT 0,
    thp_m INTEGER DEFAULT 0,
    thp_a INTEGER DEFAULT 0,
    ft_m INTEGER DEFAULT 0,
    ft_a INTEGER DEFAULT 0,
    off_reb INTEGER DEFAULT 0,
    def_reb INTEGER DEFAULT 0,
    reb INTEGER DEFAULT 0,
    ast INTEGER DEFAULT 0,
    to_cnt INTEGER DEFAULT 0, -- renamed from 'to' because it's a reserved SQL keyword
    stl INTEGER DEFAULT 0,
    blk INTEGER DEFAULT 0,
    pf INTEGER DEFAULT 0,
    plus_minus INTEGER,
    index_rating INTEGER, -- renamed from 'index' because it's a reserved SQL keyword
    row_confidence NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, player_profile_id) -- A player can only have one stat line per match
);

CREATE INDEX IF NOT EXISTS idx_match_player_stats_match ON match_player_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_match_player_stats_player ON match_player_stats(player_profile_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE match_stat_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_player_stats ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for match_stat_uploads
-- Users can view uploads for their organization
CREATE POLICY "Users can view org match stat uploads" ON match_stat_uploads
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM users WHERE id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM players WHERE user_id::text = (SELECT auth.uid())::text
        )
    );

-- Owners and staff can manage uploads
CREATE POLICY "Owners and Staff can manage match stat uploads" ON match_stat_uploads
    FOR ALL WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM users WHERE id::text = (SELECT auth.uid())::text AND (account_type = 'team' OR account_type = 'coach')
        )
    );

-- 6. RLS Policies for match_player_stats
-- Anyone in the org can read, AND players with linked_user_id (which is user_id in players) can read their own
CREATE POLICY "Users can view match player stats" ON match_player_stats
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM users WHERE id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM players WHERE user_id::text = (SELECT auth.uid())::text
        )
        OR player_profile_id IN (
            SELECT id FROM players WHERE user_id::text = (SELECT auth.uid())::text
        )
    );

-- Owners and staff can insert/update/delete
CREATE POLICY "Owners and Staff can manage match player stats" ON match_player_stats
    FOR ALL WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id::text = (SELECT auth.uid())::text
            UNION
            SELECT organization_id FROM users WHERE id::text = (SELECT auth.uid())::text AND (account_type = 'team' OR account_type = 'coach')
        )
    );

-- 7. Add Triggers for updated_at
CREATE TRIGGER update_match_stat_uploads_updated_at
    BEFORE UPDATE ON match_stat_uploads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_match_player_stats_updated_at
    BEFORE UPDATE ON match_player_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tell PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
