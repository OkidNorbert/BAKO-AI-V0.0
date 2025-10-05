-- Create tables for coach features
CREATE TABLE IF NOT EXISTS player_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    position VARCHAR(50),
    height_cm INTEGER,
    weight_kg INTEGER,
    team_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty VARCHAR(50),
    duration INTEGER,
    frequency INTEGER,
    coach_id INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_assignments (
    id SERIAL PRIMARY KEY,
    training_plan_id INTEGER REFERENCES training_plans(id),
    player_id INTEGER,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_rate INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS team_announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS team_messages (
    id SERIAL PRIMARY KEY,
    sender VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS team_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location VARCHAR(255),
    event_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'scheduled',
    participants TEXT[],
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data
INSERT INTO team_announcements (title, content, author, priority) VALUES 
('Welcome to the Team!', 'Welcome to our basketball team. Let''s have a great season!', 'Coach John', 'high'),
('Practice Schedule', 'Practice will be held every Tuesday and Thursday at 6 PM.', 'Coach John', 'medium');

INSERT INTO team_events (title, description, start_time, end_time, location, event_type, created_by) VALUES 
('Team Practice', 'Regular team practice session', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '2 hours', 'Main Court', 'practice', 'Coach John'),
('Game vs Eagles', 'Championship game against Eagles', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '2 hours', 'Eagles Arena', 'game', 'Coach John');
