#!/usr/bin/env python3
"""
Script to create Supabase storage bucket for videos
Run this script to automatically create the 'videos' bucket in Supabase
"""

import sys
import os

# Supabase credentials
SUPABASE_URL = "https://qpvkuhcmhntsamgabovo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdmt1aGNtaG50c2FtZ2Fib3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3Mzk4NDMsImV4cCI6MjA3OTMxNTg0M30.atEXiMulOroQLzXkZpyI5ERj59tBDI0_zLAl2Yu8bJk"

def create_bucket():
    """Create the 'videos' bucket in Supabase Storage using SQL"""
    
    try:
        from supabase import create_client, Client
    except ImportError:
        print("❌ supabase-py not installed. Please install it:")
        print("   pip install supabase")
        return False
    
    bucket_name = "videos"
    
    print(f"🚀 Creating Supabase storage bucket '{bucket_name}'...")
    print(f"   Project URL: {SUPABASE_URL}")
    
    try:
        # Initialize Supabase client
        client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connected to Supabase")
        
        # Check if bucket already exists
        try:
            client.storage.from_(bucket_name).list()
            print(f"✅ Bucket '{bucket_name}' already exists!")
            return True
        except Exception as check_error:
            error_str = str(check_error).lower()
            if "not found" in error_str or "404" in error_str:
                print(f"📦 Bucket '{bucket_name}' does not exist. Creating it...")
            else:
                print(f"⚠️  Error checking bucket: {check_error}")
        
        # Create bucket using SQL via Supabase client
        # The Python client doesn't have a direct create_bucket method,
        # so we'll use the REST API via the client's underlying httpx client
        
        try:
            # Use the client's internal httpx client to make REST API call
            import httpx
            
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            }
            
            bucket_data = {
                "id": bucket_name,
                "name": bucket_name,
                "public": True
            }
            
            # Create bucket via REST API
            storage_url = f"{SUPABASE_URL}/storage/v1/bucket"
            with httpx.Client() as http_client:
                response = http_client.post(storage_url, json=bucket_data, headers=headers, timeout=10.0)
            
            if response.status_code in [200, 201]:
                print(f"✅ Successfully created bucket '{bucket_name}'!")
                return True
            elif response.status_code == 409:
                print(f"✅ Bucket '{bucket_name}' already exists!")
                return True
            else:
                print(f"⚠️  API returned status {response.status_code}")
                print(f"   Response: {response.text}")
                raise Exception(f"API error: {response.status_code}")
                
        except ImportError:
            print("⚠️  httpx not available. Using SQL method instead.")
            raise
        except Exception as api_error:
            print(f"⚠️  API method failed: {api_error}")
            raise
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n📝 Please create the bucket manually:")
        print("   Method 1 - Via Dashboard:")
        print("   1. Go to https://supabase.com/dashboard")
        print("   2. Select your project")
        print("   3. Go to Storage > Create bucket")
        print(f"   4. Name: {bucket_name}")
        print("   5. Public: Yes")
        print("   6. Click Create")
        print("\n   Method 2 - Via SQL Editor:")
        print("   1. Go to SQL Editor in Supabase dashboard")
        print("   2. Run this SQL:")
        print(f"   INSERT INTO storage.buckets (id, name, public)")
        print(f"   VALUES ('{bucket_name}', '{bucket_name}', true)")
        print(f"   ON CONFLICT (id) DO NOTHING;")
        return False


if __name__ == "__main__":
    success = create_bucket()
    
    if success:
        print("\n✅ Setup complete! The 'videos' bucket is ready.")
        sys.exit(0)
    else:
        print("\n⚠️  Automatic bucket creation failed. Please use manual method above.")
        sys.exit(1)
