"""
Database initialization and migration system.
Automatically creates tables on server startup.
"""

import logging
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.database import get_db

logger = logging.getLogger(__name__)

# SQL statements for creating tables
TABLE_CREATION_SQL = {
    "player_profiles": """
        CREATE TABLE IF NOT EXISTS player_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            position VARCHAR(50),
            height_cm INTEGER,
            weight_kg INTEGER,
            team_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """,
    
    "training_plans": """
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
    """,
    
    "training_assignments": """
        CREATE TABLE IF NOT EXISTS training_assignments (
            id SERIAL PRIMARY KEY,
            training_plan_id INTEGER REFERENCES training_plans(id),
            player_id INTEGER,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completion_rate INTEGER DEFAULT 0
        );
    """,
    
    "team_announcements": """
        CREATE TABLE IF NOT EXISTS team_announcements (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            author VARCHAR(255) NOT NULL,
            priority VARCHAR(20) DEFAULT 'medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_read BOOLEAN DEFAULT FALSE
        );
    """,
    
    "team_messages": """
        CREATE TABLE IF NOT EXISTS team_messages (
            id SERIAL PRIMARY KEY,
            sender VARCHAR(255) NOT NULL,
            recipient VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_read BOOLEAN DEFAULT FALSE
        );
    """,
    
    "team_events": """
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
    """,
    
    "team_goals": """
        CREATE TABLE IF NOT EXISTS team_goals (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            target_value INTEGER,
            current_value INTEGER DEFAULT 0,
            unit VARCHAR(50),
            deadline TIMESTAMP,
            priority VARCHAR(20) DEFAULT 'medium',
            status VARCHAR(50) DEFAULT 'not_started',
            assigned_players TEXT[],
            created_by VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            progress_percentage INTEGER DEFAULT 0
        );
    """,
    
    "team_reports": """
        CREATE TABLE IF NOT EXISTS team_reports (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            type VARCHAR(100),
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            period VARCHAR(50),
            status VARCHAR(50) DEFAULT 'ready',
            file_url VARCHAR(500),
            summary JSONB,
            created_by VARCHAR(255) NOT NULL
        );
    """,
    
    "team_notifications": """
        CREATE TABLE IF NOT EXISTS team_notifications (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            priority VARCHAR(20) DEFAULT 'medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_read BOOLEAN DEFAULT FALSE,
            action_url VARCHAR(500),
            action_text VARCHAR(100)
        );
    """,
    
    "video_analyses": """
        CREATE TABLE IF NOT EXISTS video_analyses (
            id SERIAL PRIMARY KEY,
            video_url VARCHAR(500) NOT NULL,
            thumbnail_url VARCHAR(500),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            player_name VARCHAR(255),
            session_type VARCHAR(100),
            duration INTEGER,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            analysis_status VARCHAR(50) DEFAULT 'pending',
            analysis_results JSONB,
            highlights JSONB
        );
    """
}

# No sample data - system starts with empty database
SAMPLE_DATA_SQL = []

def check_table_exists(db: Session, table_name: str) -> bool:
    """Check if a table exists in the database."""
    try:
        result = db.execute(text(f"""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '{table_name}'
            );
        """))
        return result.scalar()
    except Exception as e:
        logger.warning(f"Could not check if table {table_name} exists: {e}")
        return False

def create_table_if_not_exists(db: Session, table_name: str, sql: str) -> bool:
    """Create a table if it doesn't exist."""
    try:
        if not check_table_exists(db, table_name):
            logger.info(f"Creating table: {table_name}")
            db.execute(text(sql))
            db.commit()
            logger.info(f"Successfully created table: {table_name}")
            return True
        else:
            logger.info(f"Table {table_name} already exists, skipping")
            return False
    except Exception as e:
        logger.error(f"Failed to create table {table_name}: {e}")
        db.rollback()
        return False

def add_full_name_column_if_missing(db: Session):
    """Add full_name column to player_profiles if it doesn't exist."""
    try:
        # Check if full_name column exists
        check_column_query = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'player_profiles' AND column_name = 'full_name'
        """
        result = db.execute(text(check_column_query)).fetchone()
        
        if not result:
            logger.info("Adding full_name column to player_profiles table...")
            alter_query = text("ALTER TABLE player_profiles ADD COLUMN full_name VARCHAR(255)")
            db.execute(alter_query)
            db.commit()
            logger.info("Successfully added full_name column to player_profiles table")
        else:
            logger.info("full_name column already exists in player_profiles table")
            
    except Exception as e:
        logger.warning(f"Could not add full_name column: {e}")
        # Don't raise - this is not critical for basic functionality

def initialize_database():
    """Initialize the database with all required tables."""
    logger.info("Starting database initialization...")
    
    try:
        db = next(get_db())
        
        # Create all tables
        tables_created = 0
        for table_name, sql in TABLE_CREATION_SQL.items():
            if create_table_if_not_exists(db, table_name, sql):
                tables_created += 1
        
        # Add full_name column if missing
        add_full_name_column_if_missing(db)
        
        # No sample data to insert - system starts clean
        logger.info("Database initialized with empty tables - no sample data inserted")
        
        logger.info(f"Database initialization completed. Created {tables_created} new tables.")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
    finally:
        db.close()

def run_migrations():
    """Run any pending migrations."""
    logger.info("Running database migrations...")
    
    try:
        db = next(get_db())
        
        # Add any new columns or modifications here
        # Example: Add new columns to existing tables
        migration_queries = [
            # Add any new columns that might be needed
            # "ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS jersey_number INTEGER;",
            # "ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        ]
        
        for query in migration_queries:
            try:
                db.execute(text(query))
                db.commit()
                logger.info(f"Migration executed: {query[:50]}...")
            except Exception as e:
                logger.warning(f"Migration failed: {e}")
                db.rollback()
        
        logger.info("Database migrations completed.")
        
    except Exception as e:
        logger.error(f"Database migrations failed: {e}")
        raise
    finally:
        db.close()

def startup_database_init():
    """Initialize database on application startup."""
    try:
        logger.info("=== DATABASE INITIALIZATION START ===")
        initialize_database()
        run_migrations()
        logger.info("=== DATABASE INITIALIZATION COMPLETE ===")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        # Don't raise the exception to prevent app startup failure
        # The app can still run with limited functionality
