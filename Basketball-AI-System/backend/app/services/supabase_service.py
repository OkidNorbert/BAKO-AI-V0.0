import os
from supabase import create_client, Client
from app.core.config import settings
import logging
from typing import Dict, Any, Optional
import json
from datetime import datetime

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
            
            # Check if bucket exists by trying to list it
            try:
                self.client.storage.from_(bucket_name).list()
            except Exception as bucket_error:
                if "not found" in str(bucket_error).lower() or "404" in str(bucket_error):
                    logger.warning(f"⚠️  Supabase bucket '{bucket_name}' not found. Skipping video upload.")
                    logger.info("   💡 Create the bucket in Supabase dashboard: Storage > Create bucket > 'videos'")
                    return None
                raise  # Re-raise if it's a different error
            
            # Upload video
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
            error_str = str(e).lower()
            if "not found" in error_str or "404" in error_str or "bucket" in error_str:
                logger.debug(f"⚠️  Supabase bucket not configured. Video upload skipped. (This is optional)")
                logger.debug("   💡 To enable: Create 'videos' bucket in Supabase Storage dashboard")
            else:
                logger.warning(f"⚠️  Video upload failed: {e}")
            return None

    def _serialize_for_json(self, obj: Any) -> Any:
        """Recursively serialize objects for JSON (handles datetime, Pydantic models, etc.)"""
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif hasattr(obj, 'model_dump'):  # Pydantic v2
            return self._serialize_for_json(obj.model_dump())
        elif hasattr(obj, 'dict'):  # Pydantic v1
            return self._serialize_for_json(obj.dict())
        elif isinstance(obj, dict):
            return {k: self._serialize_for_json(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [self._serialize_for_json(item) for item in obj]
        else:
            return obj
    
    def save_analysis(self, result: Dict[str, Any], video_url: Optional[str] = None) -> bool:
        """
        Save analysis result to Supabase Database
        """
        if not self.enabled or not self.client:
            return False
            
        try:
            table_name = "analysis_results"
            
            # Serialize result to handle datetime and Pydantic objects
            serialized_result = self._serialize_for_json(result)
            
            # Extract action info safely
            action_data = serialized_result.get("action", {})
            if isinstance(action_data, dict):
                action_label = action_data.get("label")
                action_confidence = action_data.get("confidence")
            else:
                # If action is already a string or other type
                action_label = str(action_data) if action_data else None
                action_confidence = None
            
            data = {
                "action": action_label,
                "confidence": action_confidence,
                "metrics": serialized_result.get("metrics"),
                "recommendations": serialized_result.get("recommendations"),
                "video_url": video_url,
                "raw_result": serialized_result  # Now properly serialized
            }
            
            # Check if table exists by trying to query it first
            try:
                self.client.table(table_name).select("id").limit(1).execute()
            except Exception as table_check_error:
                error_str = str(table_check_error).lower()
                if "not found" in error_str or "404" in error_str or "pgrst205" in error_str or "table" in error_str:
                    logger.debug(f"⚠️  Supabase table '{table_name}' not found. Analysis save skipped. (This is optional)")
                    logger.debug("   💡 To enable: Run supabase_setup.sql in Supabase SQL Editor")
                    return False
                raise  # Re-raise if it's a different error
            
            # Table exists, insert data
            self.client.table(table_name).insert(data).execute()
            logger.info("✅ Analysis result saved to Supabase DB")
            return True
            
        except Exception as e:
            error_str = str(e).lower()
            if "not found" in error_str or "404" in error_str or "pgrst205" in error_str or "table" in error_str:
                logger.debug(f"⚠️  Supabase table not configured. Analysis save skipped. (This is optional)")
                logger.debug("   💡 To enable: Run supabase_setup.sql in Supabase SQL Editor")
            else:
                logger.warning(f"⚠️  Failed to save analysis to Supabase DB: {e}")
            return False

# Singleton instance
supabase_service = SupabaseService()
