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
    """No sample data - system starts with empty database."""
    print("✅ Database initialized with empty tables - no sample data created")
    print("Users can register accounts through the web interface")

if __name__ == "__main__":
    init_db()
    create_sample_data()
