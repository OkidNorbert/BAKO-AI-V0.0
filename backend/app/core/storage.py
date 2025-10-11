"""
MinIO storage utilities for video file management.
"""

import os
from datetime import timedelta
from typing import Optional
from minio import Minio
from minio.error import S3Error
from app.core.config import settings
import logging
import time # Import time for sleep

logger = logging.getLogger(__name__)

class StorageManager:
    """MinIO storage manager for video files."""
    
    def __init__(self):
        """Initialize MinIO client."""
        logger.debug(f"MinIO __init__: Endpoint={settings.MINIO_ENDPOINT}, AccessKey={settings.MINIO_ACCESS_KEY}, SecretKey={'*' * len(settings.MINIO_SECRET_KEY) if settings.MINIO_SECRET_KEY else 'None'}")
        logger.debug(f"MinIO __init__: Endpoint Type={type(settings.MINIO_ENDPOINT)}, AccessKey Type={type(settings.MINIO_ACCESS_KEY)}, SecretKey Type={type(settings.MINIO_SECRET_KEY)}")
        
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=False  # Set to True for HTTPS
        )
        self.bucket_name = settings.MINIO_BUCKET
        self._ensure_bucket_exists()

    # Removed _get_minio_client_for_presigned_url

    def _ensure_bucket_exists(self):
        """Ensure the bucket exists, create if it doesn't, with retries."""
        max_retries = 10
        retry_delay_seconds = 5
        for i in range(max_retries):
            try:
                if not self.client.bucket_exists(self.bucket_name):
                    logger.warning(f"Bucket '{self.bucket_name}' does not exist. Attempting to create... (Attempt {i+1}/{max_retries})")
                    self.client.make_bucket(self.bucket_name)
                    logger.info(f"Created bucket: {self.bucket_name}")
                else:
                    logger.info(f"Bucket '{self.bucket_name}' already exists.")
                return # Success, exit loop
            except S3Error as e:
                if e.code == 'NoSuchBucket' or 'connection refused' in e.message.lower():
                    logger.warning(f"MinIO bucket or connection error during check/create (Attempt {i+1}/{max_retries}): {e.message}. Retrying in {retry_delay_seconds} seconds...")
                    time.sleep(retry_delay_seconds)
                else:
                    logger.error(f"Error ensuring bucket exists: {e}")
                    raise
            except Exception as e:
                logger.warning(f"Unexpected error during MinIO bucket check/create (Attempt {i+1}/{max_retries}): {e}. Retrying in {retry_delay_seconds} seconds...")
                time.sleep(retry_delay_seconds)
        
        logger.error(f"Failed to ensure MinIO bucket '{self.bucket_name}' exists after {max_retries} attempts.")
        raise RuntimeError(f"Failed to ensure MinIO bucket '{self.bucket_name}' exists.")
    
    def generate_presigned_upload_url(
        self, 
        object_name: str, 
        expires: timedelta = timedelta(hours=1)
    ) -> str:
        """Generate a presigned URL for uploading a file."""
        try:
            logger.debug(f"Attempting to generate presigned URL for object: {object_name} in bucket: {self.bucket_name}")
            
            # Use MINIO_EXTERNAL_ENDPOINT for the presigned URL if available, otherwise default client's endpoint
            endpoint_url = settings.MINIO_EXTERNAL_ENDPOINT if settings.MINIO_EXTERNAL_ENDPOINT else None

            url = self.client.presigned_put_object(
                self.bucket_name,
                object_name,
                expires=expires,
                endpoint_url=endpoint_url # Pass the external endpoint here
            )
            if url is None:
                logger.error(f"MinIO client.presigned_put_object returned None for object: {object_name}")
                raise RuntimeError("MinIO presigned_put_object returned None")
            logger.debug(f"Generated presigned URL (first 50 chars): {url[:50]}...")
            return url
        except S3Error as e:
            logger.error(f"MinIO S3Error in generate_presigned_upload_url: code={e.code}, message={e.message}")
            logger.error(f"MinIO S3Error details: resource={e.resource}, request_id={e.request_id}, host_id={e.host_id}, bucket_name={e.bucket_name}")
            raise
    
    def generate_presigned_download_url(
        self, 
        object_name: str, 
        expires: timedelta = timedelta(hours=1)
    ) -> str:
        """Generate a presigned URL for downloading a file."""
        try:
            # Use MINIO_EXTERNAL_ENDPOINT for the presigned URL if available, otherwise default client's endpoint
            endpoint_url = settings.MINIO_EXTERNAL_ENDPOINT if settings.MINIO_EXTERNAL_ENDPOINT else None
            
            url = self.client.presigned_get_object(
                self.bucket_name,
                object_name,
                expires=expires,
                endpoint_url=endpoint_url # Pass the external endpoint here
            )
            return url
        except S3Error as e:
            logger.error(f"Error generating download URL: {e}")
            raise
    
    def get_object_info(self, object_name: str) -> Optional[dict]:
        """Get object information."""
        try:
            stat = self.client.stat_object(self.bucket_name, object_name)
            return {
                "size": stat.size,
                "etag": stat.etag,
                "last_modified": stat.last_modified,
                "content_type": stat.content_type
            }
        except S3Error as e:
            logger.error(f"Error getting object info: {e}")
            return None
    
    def delete_object(self, object_name: str) -> bool:
        """Delete an object from storage."""
        try:
            self.client.remove_object(self.bucket_name, object_name)
            return True
        except S3Error as e:
            logger.error(f"Error deleting object: {e}")
            return False
    
    def object_exists(self, object_name: str) -> bool:
        """Check if an object exists."""
        try:
            self.client.stat_object(self.bucket_name, object_name)
            return True
        except S3Error:
            return False


# Global storage manager instance - lazy initialization
storage_manager = None

def get_storage_manager():
    """Always return a new storage manager instance to prevent stale clients."""
    return StorageManager()

