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

logger = logging.getLogger(__name__)

class StorageManager:
    """MinIO storage manager for video files."""
    
    def __init__(self):
        """Initialize MinIO client."""
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ROOT_USER,
            secret_key=settings.MINIO_ROOT_PASSWORD,
            secure=False  # Set to True for HTTPS
        )
        self.bucket_name = settings.MINIO_BUCKET
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Ensure the bucket exists, create if it doesn't."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Error creating bucket: {e}")
            raise
    
    def generate_presigned_upload_url(
        self, 
        object_name: str, 
        expires: timedelta = timedelta(hours=1)
    ) -> str:
        """Generate a presigned URL for uploading a file."""
        try:
            url = self.client.presigned_put_object(
                self.bucket_name,
                object_name,
                expires=expires
            )
            return url
        except S3Error as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise
    
    def generate_presigned_download_url(
        self, 
        object_name: str, 
        expires: timedelta = timedelta(hours=1)
    ) -> str:
        """Generate a presigned URL for downloading a file."""
        try:
            url = self.client.presigned_get_object(
                self.bucket_name,
                object_name,
                expires=expires
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
    """Get or create storage manager instance."""
    global storage_manager
    if storage_manager is None:
        storage_manager = StorageManager()
    return storage_manager

