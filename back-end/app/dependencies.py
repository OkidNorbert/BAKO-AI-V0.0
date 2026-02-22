"""
FastAPI dependency injection functions.

Provides common dependencies for authentication, authorization, 
and service access across all API endpoints.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import get_settings, Settings
from app.core.security import decode_access_token
from app.core import AuthenticationError, AuthorizationError
from app.models.user import AccountType, TokenPayload
from app.services.supabase_client import SupabaseService, get_supabase_service


# OAuth2 bearer scheme for JWT tokens
security = HTTPBearer(auto_error=False)


async def get_settings_dep() -> Settings:
    """Dependency to get application settings."""
    return get_settings()


async def get_supabase(
    settings: Settings = Depends(get_settings_dep)
) -> SupabaseService:
    """Dependency to get Supabase service instance."""
    return get_supabase_service()


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """
    Get current user from JWT token if present.
    Returns None if no token provided (for public endpoints).
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        return None
    
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "account_type": payload.get("account_type"),
        "organization_id": payload.get("organization_id")
    }




async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    token_query: Optional[str] = Query(None, alias="token")
) -> dict:
    """
    Get current authenticated user from JWT token (Header or Query param).
    Raises HTTPException if not authenticated.
    """
    token = None
    if credentials:
        token = credentials.credentials
    elif token_query:
        token = token_query
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "account_type": payload.get("account_type"),
        "organization_id": payload.get("organization_id")
    }


async def require_team_account(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Dependency that requires a TEAM or COACH account type.
    Use for team-only endpoints.
    """
    allowed_types = [AccountType.TEAM.value, AccountType.COACH.value]
    if current_user.get("account_type") not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires a TEAM or COACH account",
        )
    return current_user


async def require_organization_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Dependency that requires a TEAM account type (Organization Owner).
    Use for critical administrative tasks like staff linking and settings.
    """
    if current_user.get("account_type") != AccountType.TEAM.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This operation requires organization owner administrative privileges",
        )
    return current_user

async def require_personal_account(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Dependency that requires a PERSONAL account type.
    Use for personal-only endpoints.
    """
    if current_user.get("account_type") != AccountType.PERSONAL.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires a PERSONAL account",
        )
    return current_user


async def require_linked_account(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Dependency that requires the user to be linked to an organization.
    """
    if not current_user.get("organization_id"):
        # For TEAM accounts, they might not have organization_id in token yet if just created,
        # but for players/coaches, they MUST be linked.
        if current_user.get("account_type") != AccountType.TEAM.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be linked to a team to access this feature",
            )
    return current_user


async def require_staff_member(
    current_user: dict = Depends(require_team_account),
) -> dict:
    """
    Dependency that requires the user to be a COACH who is linked to an organization.
    Used for features delegated to coaching staff (match upload, scheduling, stats).
    """
    if current_user.get("account_type") != AccountType.COACH.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature is managed by the Coaching Staff",
        )
    if not current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your coach account has not been linked to a team yet. Ask your organization owner to add you via the Coaching Staff page.",
        )
    return current_user

def require_owner_or_admin(resource_owner_id: str):
    """
    Factory for dependency that checks if user owns a resource.
    
    Usage:
        @router.delete("/items/{item_id}")
        async def delete_item(
            item_id: str,
            _: dict = Depends(require_owner_or_admin(item.owner_id))
        ):
            ...
    """
    async def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("id") != resource_owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this resource",
            )
        return current_user
    return dependency
