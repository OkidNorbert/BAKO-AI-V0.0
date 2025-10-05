#!/usr/bin/env python3
"""
Create team management tables directly in the database.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine

def create_team_tables():
    """Create team management tables."""
    print("Creating team management tables...")
    
    with engine.connect() as conn:
        # Create training_plans table
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS training_plans (
            id SERIAL PRIMARY KEY,
            name VARCHAR NOT NULL,
            description TEXT,
            category VARCHAR NOT NULL,
            difficulty VARCHAR NOT NULL,
            duration INTEGER NOT NULL,
            frequency VARCHAR NOT NULL,
            coach_id INTEGER REFERENCES users(id),
            status VARCHAR NOT NULL DEFAULT 'draft',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE
        )
        """))
        
        # Create training_assignments table
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS training_assignments (
            id SERIAL PRIMARY KEY,
            training_plan_id INTEGER NOT NULL REFERENCES training_plans(id),
            player_id INTEGER NOT NULL REFERENCES player_profiles(id),
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completion_rate FLOAT NOT NULL DEFAULT 0.0,
            status VARCHAR NOT NULL DEFAULT 'assigned',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(training_plan_id, player_id)
        )
        """))
        
        # Add missing columns to events table if they don't exist
        try:
            conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS performance_score FLOAT"))
        except:
            pass
            
        try:
            conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS duration INTEGER"))
        except:
            pass
            
        try:
            conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS end_timestamp FLOAT"))
        except:
            pass
            
        try:
            conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR"))
        except:
            pass
            
        try:
            conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS notes TEXT"))
        except:
            pass
        
        # Add missing columns to videos table if they don't exist
        try:
            conn.execute(text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS session_id INTEGER"))
        except:
            pass
            
        try:
            conn.execute(text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE"))
        except:
            pass
        
        conn.commit()
        print("✅ Team management tables created successfully!")

if __name__ == "__main__":
    create_team_tables()
