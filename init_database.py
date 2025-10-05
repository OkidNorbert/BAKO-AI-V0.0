#!/usr/bin/env python3
"""
Database initialization script for Basketball Performance System.
This script creates all necessary tables and sample data.
"""

import sys
import os
import logging

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app.core.database_init import startup_database_init
    print("🏀 Basketball Performance System - Database Initialization")
    print("=" * 60)
    print("Initializing database tables and sample data...")
    
    startup_database_init()
    
    print("✅ Database initialization completed successfully!")
    print("🎯 All coach feature tables are now available.")
    print("🚀 You can now use the application without 'service unavailable' errors!")
    
except ImportError as e:
    print(f"❌ Error: Could not import database initialization module: {e}")
    print("Make sure you're running this from the project root directory.")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ Error during database initialization: {e}")
    sys.exit(1)
