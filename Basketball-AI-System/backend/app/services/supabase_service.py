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
        self.local_history_file = os.path.join(settings.RESULTS_DIR, "history.json")
        
        # Ensure results directory exists
        os.makedirs(settings.RESULTS_DIR, exist_ok=True)
        
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                self.enabled = True
                logger.info("✅ Supabase client initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Supabase client: {e}")
        else:
            logger.warning("⚠️  Supabase credentials not found. Supabase integration disabled.")

    def _save_local(self, data: Dict[str, Any]) -> bool:
        """Save analysis result to local JSON file"""
        try:
            history = []
            if os.path.exists(self.local_history_file):
                try:
                    with open(self.local_history_file, 'r') as f:
                        history = json.load(f)
                except json.JSONDecodeError:
                    history = []
            
            # Add timestamp if missing
            if 'created_at' not in data:
                data['created_at'] = datetime.now().isoformat()
                
            # Prepend new record (newest first)
            history.insert(0, data)
            
            # Keep only last 100 records locally
            history = history[:100]
            
            with open(self.local_history_file, 'w') as f:
                json.dump(history, f, indent=2)
                
            logger.info(f"✅ Analysis saved locally to {self.local_history_file}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save local history: {e}")
            return False

    def _get_local(self, limit: int = 50) -> list:
        """Get history from local JSON file"""
        try:
            if not os.path.exists(self.local_history_file):
                return []
                
            with open(self.local_history_file, 'r') as f:
                history = json.load(f)
                
            return history[:limit]
        except Exception as e:
            logger.error(f"❌ Failed to read local history: {e}")
            return []

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
        Save analysis result to Supabase Database AND local storage
        """
        # Always save locally first as backup
        try:
            serialized_result = self._serialize_for_json(result)
            
            # Extract action info safely
            action_data = serialized_result.get("action", {})
            if isinstance(action_data, dict):
                action_label = action_data.get("label")
                action_confidence = action_data.get("confidence")
            else:
                action_label = str(action_data) if action_data else None
                action_confidence = None
            
            data = {
                "action": action_label,
                "confidence": action_confidence,
                "metrics": serialized_result.get("metrics"),
                "recommendations": serialized_result.get("recommendations"),
                "video_url": video_url,
                "raw_result": serialized_result,
                "created_at": datetime.now().isoformat()
            }
            
            # Save locally
            self._save_local(data)
            
            # Then try Supabase
            if not self.enabled or not self.client:
                return True # Return true since we saved locally
                
            table_name = "analysis_results"
            
            # Check if table exists by trying to query it first
            try:
                self.client.table(table_name).select("id").limit(1).execute()
            except Exception as table_check_error:
                error_str = str(table_check_error).lower()
                if "not found" in error_str or "404" in error_str or "pgrst205" in error_str or "table" in error_str:
                    logger.debug(f"⚠️  Supabase table '{table_name}' not found. Analysis saved LOCALLY only.")
                    return True
                raise  # Re-raise if it's a different error
            
            # Table exists, insert data
            # Remove created_at to let DB handle it, or keep it to sync
            db_data = data.copy()
            if 'created_at' in db_data:
                del db_data['created_at']
                
            self.client.table(table_name).insert(db_data).execute()
            logger.info("✅ Analysis result saved to Supabase DB")
            return True
            
        except Exception as e:
            logger.warning(f"⚠️  Failed to save to Supabase (saved locally): {e}")
            return True # Still return true as we saved locally

    def get_history(self, limit: int = 50) -> list:
        """
        Retrieve analysis history from Supabase Database OR local storage
        """
        # Try Supabase first
        supabase_history = []
        supabase_success = False
        
        if self.enabled and self.client:
            try:
                table_name = "analysis_results"
                
                # Check if table exists
                try:
                    self.client.table(table_name).select("id").limit(1).execute()
                    
                    # Fetch history
                    response = self.client.table(table_name)\
                        .select("*")\
                        .order("created_at", desc=True)\
                        .limit(limit)\
                        .execute()
                    
                    if response.data:
                        logger.info(f"✅ Retrieved {len(response.data)} records from Supabase")
                        supabase_history = response.data
                        supabase_success = True
                except Exception:
                    # Table doesn't exist or other error, fall through to local
                    pass
                    
            except Exception as e:
                logger.warning(f"⚠️  Failed to retrieve history from Supabase: {e}")
        
        # If Supabase failed or returned nothing, try local
        if not supabase_success or not supabase_history:
            logger.info("🔄 Fetching history from local storage")
            return self._get_local(limit)
            
        return supabase_history

# Singleton instance
supabase_service = SupabaseService()
