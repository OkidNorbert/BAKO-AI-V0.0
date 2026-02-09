"""
Supabase client service for database and storage operations.
"""
from typing import Optional
import anyio

from app.config import get_settings

# Try to import supabase, provide fallback for local development
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None


class SupabaseService:
    """
    Supabase client wrapper providing database and storage operations.
    
    Falls back to local mock operations if Supabase is not configured.
    """
    
    def __init__(self):
        self._client: Optional[Client] = None
        self._settings = get_settings()
        self._initialized = False
        # Allowlist of tables this service is permitted to touch. This reduces
        # the blast radius of accidental or malicious misuse.
        self._allowed_tables: set[str] = {
            "users",
            "videos",
            "organizations",
            "players",
            "teams",
            "analysis_results",
            "detections",
            "analytics",
            "notifications",
            "activities",
            "matches",
            "schedules",
        }
    
    def _initialize(self) -> None:
        """Initialize the Supabase client if not already done."""
        if self._initialized:
            return
            
        if not SUPABASE_AVAILABLE:
            print("Warning: Supabase library not installed. Running in local mode.")
            self._initialized = True
            return
            
        if not self._settings.supabase_url or not self._settings.supabase_key:
            print("Warning: Supabase credentials not configured. Running in local mode.")
            self._initialized = True
            return
            
        try:
            self._client = create_client(
                self._settings.supabase_url,
                self._settings.supabase_key
            )
            self._initialized = True
        except Exception as e:
            print(f"Warning: Failed to initialize Supabase client: {e}")
            self._initialized = True
    
    @property
    def client(self) -> Optional[Client]:
        """Get the Supabase client instance."""
        if not self._initialized:
            self._initialize()
        return self._client
    
    @property
    def is_connected(self) -> bool:
        """Check if Supabase is connected and available."""
        return self.client is not None

    async def _run_sync(self, fn):
        """Run a blocking function in a thread to avoid blocking the event loop."""
        return await anyio.to_thread.run_sync(fn)
    
    # ==================== Auth Operations ====================
    
    async def sign_up(self, email: str, password: str, metadata: dict = None) -> dict:
        """Register a new user with Supabase Auth."""
        if not self.is_connected:
            # Local mock for development
            return {
                "user": {
                    "id": "mock-user-id",
                    "email": email,
                    "user_metadata": metadata or {}
                }
            }
        
        response = await self._run_sync(lambda: self.client.auth.sign_up({
            "email": email,
            "password": password,
            "options": {"data": metadata or {}}
        }))
        return response
    
    async def sign_in(self, email: str, password: str) -> dict:
        """Sign in a user with email/password."""
        if not self.is_connected:
            return {
                "user": {"id": "mock-user-id", "email": email},
                "session": {"access_token": "mock-token"}
            }
        
        response = await self._run_sync(lambda: self.client.auth.sign_in_with_password({
            "email": email,
            "password": password
        }))
        return response
    
    async def get_user(self, token: str) -> Optional[dict]:
        """Get user from JWT token."""
        if not self.is_connected:
            return {"id": "mock-user-id", "email": "mock@example.com"}
        
        response = await self._run_sync(lambda: self.client.auth.get_user(token))
        return response.user if response else None
    
    # ==================== Database Operations ====================
    
    async def insert(self, table: str, data: dict) -> dict:
        """Insert a record into a table."""
        if not self.is_connected:
            return {"id": "mock-id", **data}
        if table not in self._allowed_tables:
            raise ValueError(f"Table '{table}' is not allowed for insert operations")
        
        response = await self._run_sync(lambda: self.client.table(table).insert(data).execute())
        return response.data[0] if response.data else {}

    async def insert_many(self, table: str, rows: list[dict], chunk_size: int = 500) -> int:
        """Insert many records (chunked). Returns inserted row count (best-effort)."""
        if not rows:
            return 0
        if not self.is_connected:
            return len(rows)
        if table not in self._allowed_tables:
            raise ValueError(f"Table '{table}' is not allowed for bulk insert operations")

        inserted = 0
        for i in range(0, len(rows), chunk_size):
            chunk = rows[i : i + chunk_size]
            response = await self._run_sync(lambda: self.client.table(table).insert(chunk).execute())
            inserted += len(response.data or [])
        return inserted
    
    async def select(
        self, 
        table: str, 
        columns: str = "*",
        filters: dict = None,
        limit: int = None,
        order_by: str = None,
        ascending: bool = True
    ) -> list:
        """Select records from a table."""
        if not self.is_connected:
            return []
        if table not in self._allowed_tables:
            raise ValueError(f"Table '{table}' is not allowed for select operations")
        
        query = self.client.table(table).select(columns)
        
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        if order_by:
            query = query.order(order_by, desc=not ascending)
        
        if limit:
            query = query.limit(limit)
        
        response = await self._run_sync(lambda: query.execute())
        return response.data or []
    
    async def select_in(
        self,
        table: str,
        column: str,
        values: list,
        columns: str = "*",
        filters: dict = None,
        limit: int = None,
        order_by: str = None,
        ascending: bool = True,
    ) -> list:
        """Select records where column is in values."""
        if not self.is_connected:
            return []
        if not values:
            return []
        if table not in self._allowed_tables:
            raise ValueError(f"Table '{table}' is not allowed for select operations")

        query = self.client.table(table).select(columns).in_(column, values)
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        if order_by:
            query = query.order(order_by, desc=not ascending)
        if limit:
            query = query.limit(limit)

        response = await self._run_sync(lambda: query.execute())
        return response.data or []

    async def select_one(self, table: str, id: str, columns: str = "*") -> Optional[dict]:
        """Select a single record by ID."""
        if not self.is_connected:
            return None
        if table not in self._allowed_tables:
            raise ValueError(f"Table '{table}' is not allowed for select operations")
        
        response = await self._run_sync(
            lambda: self.client.table(table).select(columns).eq("id", id).single().execute()
        )
        return response.data
    
    async def update(self, table: str, id: str, data: dict) -> dict:
        """Update a record by ID."""
        if not self.is_connected:
            return {"id": id, **data}
        if table not in self._allowed_tables:
            raise ValueError(f"Table '{table}' is not allowed for update operations")
        
        response = await self._run_sync(lambda: self.client.table(table).update(data).eq("id", id).execute())
        return response.data[0] if response.data else {}
    
    async def delete(self, table: str, id: str) -> bool:
        """Delete a record by ID."""
        if not self.is_connected:
            return True
        if table not in self._allowed_tables:
            raise ValueError(f"Table '{table}' is not allowed for delete operations")
        
        await self._run_sync(lambda: self.client.table(table).delete().eq("id", id).execute())
        return True

    async def delete_where(self, table: str, filters: dict) -> bool:
        """Delete records matching equality filters."""
        if not self.is_connected:
            return True
        if not filters:
            raise ValueError("delete_where requires filters")
        if table not in self._allowed_tables:
            raise ValueError(f"Table '{table}' is not allowed for delete operations")

        query = self.client.table(table).delete()
        for key, value in filters.items():
            query = query.eq(key, value)

        await self._run_sync(lambda: query.execute())
        return True
    
    # ==================== Storage Operations ====================
    
    async def upload_file(
        self, 
        bucket: str, 
        path: str, 
        file_data: bytes,
        content_type: str = "video/mp4"
    ) -> str:
        """Upload a file to Supabase Storage."""
        if not self.is_connected:
            # Local file storage fallback
            import os
            settings = get_settings()
            local_path = os.path.join(settings.upload_dir, path)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(file_data)
            return local_path
        
        await self._run_sync(lambda: self.client.storage.from_(bucket).upload(
            path,
            file_data,
            {"content-type": content_type}
        ))
        return f"{self._settings.supabase_url}/storage/v1/object/public/{bucket}/{path}"
    
    async def get_file_url(self, bucket: str, path: str, expires_in: int = 3600) -> str:
        """Get a signed URL for a file."""
        if not self.is_connected:
            return f"/uploads/{path}"
        
        response = await self._run_sync(lambda: self.client.storage.from_(bucket).create_signed_url(path, expires_in))
        return response.get("signedURL", "")
    
    async def delete_file(self, bucket: str, path: str) -> bool:
        """Delete a file from storage."""
        if not self.is_connected:
            import os
            settings = get_settings()
            local_path = os.path.join(settings.upload_dir, path)
            if os.path.exists(local_path):
                os.remove(local_path)
            return True
        
        await self._run_sync(lambda: self.client.storage.from_(bucket).remove([path]))
        return True


# Singleton instance
_supabase_service: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """Get the singleton Supabase service instance."""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
