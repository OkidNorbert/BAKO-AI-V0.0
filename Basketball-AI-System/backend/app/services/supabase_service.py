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
        """Save analysis result to local JSON file with corruption prevention"""
        try:
            history = []
            if os.path.exists(self.local_history_file):
                try:
                    with open(self.local_history_file, 'r', encoding='utf-8') as f:
                        history = json.load(f)
                    # Validate it's a list
                    if not isinstance(history, list):
                        logger.warning("⚠️  History file is not a list, resetting")
                        history = []
                except (json.JSONDecodeError, ValueError) as e:
                    logger.warning(f"⚠️  History file corrupted, resetting: {e}")
                    history = []
            
            # Create a copy to avoid mutating the original dict
            data_copy = data.copy()
            
            # Add timestamp if missing
            if 'created_at' not in data_copy:
                data_copy['created_at'] = datetime.now().isoformat()
                
            # Prepend new record (newest first)
            history.insert(0, data_copy)
            
            # Keep only last 100 records locally to prevent file from growing too large
            history = history[:100]
            
            # Write atomically: write to temp file first, then rename
            import tempfile
            temp_file = self.local_history_file + '.tmp'
            try:
                with open(temp_file, 'w', encoding='utf-8') as f:
                    json.dump(history, f, indent=2, ensure_ascii=False)
                    f.flush()
                    os.fsync(f.fileno())  # Ensure data is written to disk
                
                # Atomic rename
                os.replace(temp_file, self.local_history_file)
                
                logger.info(f"✅ Analysis saved locally to {self.local_history_file}")
                return True
            except Exception as write_error:
                # Clean up temp file on error
                if os.path.exists(temp_file):
                    try:
                        os.remove(temp_file)
                    except:
                        pass
                raise write_error
                
        except Exception as e:
            logger.error(f"❌ Failed to save local history: {e}")
            return False

    def _get_local(self, limit: int = 50) -> list:
        """Get history from local JSON file with corruption recovery"""
        try:
            if not os.path.exists(self.local_history_file):
                return []
            
            # Try to read the file
            try:
                with open(self.local_history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
                    
                # Validate it's a list
                if not isinstance(history, list):
                    logger.warning("⚠️  History file is not a list, resetting")
                    return []
                    
                return history[:limit]
            except (json.JSONDecodeError, ValueError) as e:
                # JSON is corrupted - try to recover or reset
                logger.warning(f"⚠️  History file is corrupted (line {getattr(e, 'lineno', 'unknown')}): {getattr(e, 'msg', str(e))}")
                logger.info("🔄 Attempting to recover history file...")
                
                # Backup corrupted file
                backup_file = self.local_history_file + '.corrupted.' + datetime.now().strftime('%Y%m%d_%H%M%S')
                try:
                    import shutil
                    shutil.copy2(self.local_history_file, backup_file)
                    logger.info(f"📦 Backed up corrupted file to {backup_file}")
                except Exception as backup_error:
                    logger.warning(f"⚠️  Failed to backup corrupted file: {backup_error}")
                
                # Simple recovery: try to read file and extract valid JSON objects
                recovered_history = []
                try:
                    with open(self.local_history_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Try to find and parse individual JSON objects
                        # Look for complete objects between [ and ]
                        import re
                        # Match complete JSON objects (handles nested objects)
                        # This regex finds objects that are properly closed
                        json_obj_pattern = r'\{(?:[^{}]|(?:\{[^{}]*\}))*\}'
                        matches = re.finditer(json_obj_pattern, content)
                        
                        for match in matches:
                            try:
                                obj = json.loads(match.group(0))
                                if isinstance(obj, dict):
                                    recovered_history.append(obj)
                            except (json.JSONDecodeError, ValueError):
                                continue
                        
                        if recovered_history:
                            logger.info(f"✅ Recovered {len(recovered_history)} records from corrupted file")
                            # Save recovered data (keep only last 100)
                            recovered_history = recovered_history[:100]
                            with open(self.local_history_file, 'w', encoding='utf-8') as f:
                                json.dump(recovered_history, f, indent=2, ensure_ascii=False)
                            return recovered_history[:limit]
                        else:
                            logger.warning("⚠️  No valid records found in corrupted file")
                except Exception as recover_error:
                    logger.error(f"❌ Recovery failed: {recover_error}")
                
                # If recovery failed, reset to empty
                logger.warning("⚠️  Resetting history file to empty")
                try:
                    with open(self.local_history_file, 'w', encoding='utf-8') as f:
                        json.dump([], f, indent=2)
                except Exception as reset_error:
                    logger.error(f"❌ Failed to reset history file: {reset_error}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Failed to read local history: {e}")
            # If file is completely unreadable, reset it
            try:
                with open(self.local_history_file, 'w', encoding='utf-8') as f:
                    json.dump([], f, indent=2)
                logger.info("✅ Reset corrupted history file")
            except:
                pass
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
                # Check for bucket not found in various error formats
                error_str = str(bucket_error).lower()
                error_repr = repr(bucket_error).lower()
                is_bucket_error = (
                    "not found" in error_str or 
                    "404" in error_str or 
                    "bucket not found" in error_str or
                    "bucket not found" in error_repr or
                    (hasattr(bucket_error, 'statusCode') and bucket_error.statusCode == 404) or
                    (isinstance(bucket_error, dict) and bucket_error.get('statusCode') == 404)
                )
                if is_bucket_error:
                    logger.warning(f"⚠️  Supabase bucket '{bucket_name}' not found. Skipping video upload.")
                    logger.info("   💡 Create the bucket in Supabase dashboard: Storage > Create bucket > 'videos'")
                    return None
                raise  # Re-raise if it's a different error
            
            # Check if file exists
            if not os.path.exists(file_path):
                logger.warning(f"⚠️  Video file not found for upload: {file_path}")
                return None
            
            # Clean filename (remove path separators)
            clean_filename = os.path.basename(filename)
            
            # Upload video
            try:
                # Check file size first
                file_size = os.path.getsize(file_path)
                if file_size == 0:
                    logger.warning(f"⚠️  Video file is empty: {file_path}")
                    return None
                
                # Supabase storage upload expects a file-like object, not bytes
                # Use the file path directly or open file in binary mode
                with open(file_path, 'rb') as f:
                    # Try upload with upsert first
                    try:
                        response = self.client.storage.from_(bucket_name).upload(
                            path=clean_filename,
                            file=f,
                            file_options={"content-type": "video/mp4", "upsert": "true"}
                        )
                    except Exception as upsert_error:
                        # If upsert fails, try without it (might not be supported)
                        f.seek(0)  # Reset file pointer
                        response = self.client.storage.from_(bucket_name).upload(
                            path=clean_filename,
                            file=f,
                            file_options={"content-type": "video/mp4"}
                        )
                
                # Get public URL
                public_url = self.client.storage.from_(bucket_name).get_public_url(clean_filename)
                logger.info(f"✅ Video uploaded to Supabase: {public_url} ({file_size/(1024*1024):.2f}MB)")
                return public_url
            except Exception as upload_error:
                error_str = str(upload_error).lower()
                error_repr = repr(upload_error).lower()
                
                # Check if it's a bucket not found error (404)
                is_bucket_error = (
                    "bucket not found" in error_str or
                    "bucket not found" in error_repr or
                    (hasattr(upload_error, 'statusCode') and upload_error.statusCode == 404) or
                    (isinstance(upload_error, dict) and upload_error.get('statusCode') == 404) or
                    (hasattr(upload_error, 'get') and upload_error.get('statusCode') == 404)
                )
                
                if is_bucket_error:
                    logger.warning(f"⚠️  Supabase bucket '{bucket_name}' not found during upload. Skipping.")
                    logger.info("   💡 Create the bucket in Supabase dashboard: Storage > Create bucket > 'videos'")
                    return None
                elif "400" in str(upload_error) or "bad request" in error_str:
                    logger.warning(f"⚠️  Supabase upload failed (400 Bad Request): {upload_error}")
                    logger.debug(f"   File: {file_path}")
                    logger.debug(f"   Filename: {clean_filename}")
                    logger.debug(f"   Size: {file_size if 'file_size' in locals() else 'unknown'} bytes")
                    logger.debug(f"   Error details: {type(upload_error).__name__}")
                    # Check if it's a file format or size issue
                    if 'file_size' in locals() and file_size > 50 * 1024 * 1024:  # 50MB
                        logger.debug("   💡 File might be too large for Supabase storage limits")
                    return None
                else:
                    logger.warning(f"⚠️  Supabase upload error: {upload_error}")
                    return None
                
        except Exception as e:
            error_str = str(e).lower()
            error_repr = repr(e).lower()
            
            # Check for bucket not found in various formats
            is_bucket_error = (
                "not found" in error_str or 
                "404" in error_str or 
                "bucket" in error_str or
                "bucket not found" in error_repr or
                (hasattr(e, 'statusCode') and e.statusCode == 404) or
                (isinstance(e, dict) and e.get('statusCode') == 404)
            )
            
            if is_bucket_error:
                logger.warning(f"⚠️  Supabase bucket 'videos' not found. Video upload skipped. (This is optional)")
                logger.info("   💡 To enable: Create 'videos' bucket in Supabase Storage dashboard")
            elif "400" in str(e) or "bad request" in error_str:
                logger.warning(f"⚠️  Video upload failed (400 Bad Request): {e}")
                logger.debug(f"   This might be due to file size limits, bucket permissions, or file format issues")
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
        # Initialize local_save_success at the start to ensure it's always in scope
        local_save_success = False
        
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
            
            # Save locally (critical backup)
            local_save_success = self._save_local(data)
            
            # Then try Supabase
            if not self.enabled or not self.client:
                # Return success only if local save succeeded
                return local_save_success
                
            table_name = "analysis_results"
            
            # Check if table exists by trying to query it first
            try:
                self.client.table(table_name).select("id").limit(1).execute()
            except Exception as table_check_error:
                error_str = str(table_check_error).lower()
                if "not found" in error_str or "404" in error_str or "pgrst205" in error_str or "table" in error_str:
                    logger.debug(f"⚠️  Supabase table '{table_name}' not found. Analysis saved LOCALLY only.")
                    return local_save_success
                raise  # Re-raise if it's a different error
            
            # Table exists, insert data
            # Remove created_at to let DB handle it, or keep it to sync
            db_data = data.copy()
            if 'created_at' in db_data:
                del db_data['created_at']
                
            self.client.table(table_name).insert(db_data).execute()
            logger.info("✅ Analysis result saved to Supabase DB")
            
            # Return True only if both local and Supabase saves succeeded
            # (as per docstring: "Save analysis result to Supabase Database AND local storage")
            if local_save_success:
                return True
            else:
                logger.warning("⚠️  Supabase save succeeded but local save failed. Returning False.")
                return False
            
        except Exception as e:
            # local_save_success is initialized at the start, so it's always in scope
            if local_save_success:
                logger.warning(f"⚠️  Failed to save to Supabase (saved locally): {e}")
            else:
                logger.error(f"❌ Failed to save analysis (both local and Supabase failed): {e}")
            # Return False when Supabase save fails, regardless of local save status
            # (as per docstring: "Save analysis result to Supabase Database AND local storage")
            return False

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
