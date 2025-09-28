#!/usr/bin/env python3
"""
Initialize database with tables and sample data.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal
from app.models import *
from app.core.auth import get_password_hash

def init_db():
    """Initialize database with tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")

def create_sample_data():
    """Create sample data for testing."""
    db = SessionLocal()
    try:
        # Check if data already exists
        if db.query(User).first():
            print("Sample data already exists, skipping...")
            return

        print("Creating sample data...")
        
        # Create sample users
        users = [
            User(
                email="admin@basketball.com",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN
            ),
            User(
                email="coach@basketball.com", 
                hashed_password=get_password_hash("coach123"),
                role=UserRole.COACH
            ),
            User(
                email="player1@basketball.com",
                hashed_password=get_password_hash("player123"),
                role=UserRole.PLAYER
            ),
            User(
                email="player2@basketball.com",
                hashed_password=get_password_hash("player123"),
                role=UserRole.PLAYER
            )
        ]
        
        for user in users:
            db.add(user)
        
        db.commit()
        
        # Create sample team
        team = Team(
            name="Thunder Hawks",
            description="Elite basketball team"
        )
        db.add(team)
        db.commit()
        
        # Create player profiles
        player1 = db.query(User).filter(User.email == "player1@basketball.com").first()
        player2 = db.query(User).filter(User.email == "player2@basketball.com").first()
        
        profiles = [
            PlayerProfile(
                user_id=player1.id,
                height_cm=185.0,
                weight_kg=80.0,
                position="PG",
                team_id=team.id
            ),
            PlayerProfile(
                user_id=player2.id,
                height_cm=195.0,
                weight_kg=90.0,
                position="C",
                team_id=team.id
            )
        ]
        
        for profile in profiles:
            db.add(profile)
        
        db.commit()
        
        print("✅ Sample data created successfully!")
        print("\nSample accounts:")
        print("Admin: admin@basketball.com / admin123")
        print("Coach: coach@basketball.com / coach123")
        print("Player 1: player1@basketball.com / player123")
        print("Player 2: player2@basketball.com / player123")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    create_sample_data()
