import os
from supabase import create_client, Client
from app.core.config import settings
import logging
from typing import Dict, Any, Optional
import json

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        self.client: Optional[Client] = None
        self.enabled = False
        
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                self.enabled = True
                logger.info("✅ Supabase client initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Supabase client: {e}")
        else:
            logger.warning("⚠️  Supabase credentials not found. Supabase integration disabled.")

    def upload_video(self, file_path: str, filename: str) -> Optional[str]:
        """
        Upload video to Supabase Storage
        Returns public URL if successful, None otherwise
        """
        if not self.enabled or not self.client:
            return None
            
        try:
            bucket_name = "videos"
            
            # Check if bucket exists (optional, assuming it does or we can't create it easily via client)
            # For now, just try to upload
            
            with open(file_path, 'rb') as f:
                self.client.storage.from_(bucket_name).upload(
                    path=filename,
                    file=f,
                    file_options={"content-type": "video/mp4"}
                )
                
            # Get public URL
            public_url = self.client.storage.from_(bucket_name).get_public_url(filename)
            logger.info(f"✅ Video uploaded to Supabase: {public_url}")
            return public_url
            
        except Exception as e:
            logger.error(f"❌ Failed to upload video to Supabase: {e}")
            return None

    def save_analysis(self, result: Dict[str, Any], video_url: Optional[str] = None) -> bool:
        """
        Save analysis result to Supabase Database
        """
        if not self.enabled or not self.client:
            return False
            
        try:
            table_name = "analysis_results"
            
            data = {
                "action": result.get("action", {}).get("label"),
                "confidence": result.get("action", {}).get("confidence"),
                "metrics": result.get("metrics"),
                "recommendations": result.get("recommendations"),
                "video_url": video_url,
                "raw_result": result
            }
            
            self.client.table(table_name).insert(data).execute()
            logger.info("✅ Analysis result saved to Supabase DB")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save analysis to Supabase DB: {e}")
            return False

# Singleton instance
supabase_service = SupabaseService()
