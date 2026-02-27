import os
import argparse
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def apply_migration(migration_file):
    if not os.path.exists(migration_file):
        print(f"File not found: {migration_file}")
        return

    with open(migration_file, 'r') as f:
        sql = f.read()

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Supabase Python SDK doesn't directly support raw SQL easy (depends on setup)
    # Usually you use the RPC or the SQL Editor. 
    # But for a script, we can try to use psycopg2 if available or just inform the user.
    # Given the environment, let's assume raw SQL needs to be run in the editor or via a specific endpoint.
    
    print("Migration SQL:")
    print("-" * 20)
    print(sql)
    print("-" * 20)
    print("\nTo apply this migration, run the SQL above in your Supabase SQL Editor.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="Path to migration .sql file")
    args = parser.parse_args()
    apply_migration(args.file)
