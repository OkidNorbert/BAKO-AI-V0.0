"""
Authentication API endpoints.
"""
from datetime import timedelta
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Request, status

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    decode_access_token,
)
from app.dependencies import get_current_user, get_supabase
from app.models.user import (
    UserCreate,
    UserLogin,
    UserUpdate,
    User,
    TokenResponse,
    RefreshTokenRequest,
    AccountType,
)
from app.services.supabase_client import SupabaseService


router = APIRouter()


def _get_limiter(request: Request) -> Limiter:
    # Helper to get the global limiter attached in app.main
    return request.app.state.limiter


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_data: UserCreate,
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Register a new user account.
    
    - **email**: Valid email address
    - **password**: Minimum 8 characters
    - **account_type**: 'team' or 'personal'
    """
    settings = get_settings()
    
    # Check if user already exists
    existing = await supabase.select("users", filters={"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_id = str(uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_record = {
        "id": user_id,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "account_type": user_data.account_type.value,
        "full_name": user_data.full_name,
    }
    
    await supabase.insert("users", user_record)
    
    # If team account, check for org or create one?
    # Schema says organizations(owner_id).
    org_id = None
    if user_data.account_type == AccountType.TEAM:
        org_id = str(uuid4())
        await supabase.insert("organizations", {
            "id": org_id,
            "name": f"{user_data.full_name or user_id}'s Team",
            "owner_id": user_id
        })

    # Create tokens
    token_data = {
        "sub": user_id,
        "email": user_data.email,
        "account_type": user_data.account_type.value,
        "organization_id": org_id
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(user_id)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_expiration_minutes * 60,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    credentials: UserLogin,
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Authenticate and get access tokens.
    """
    settings = get_settings()

    # Apply a stricter rate limit on login to protect against brute force.
    limiter = _get_limiter(request)
    limiter.limit("5/minute")(lambda *_args, **_kwargs: None)(request)
    
    # Find user
    users = await supabase.select("users", filters={"email": credentials.email})
    if not users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    user = users[0]
    
    # Verify password
    if not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Fetch organization_id if applicable
    org_id = None
    if user["account_type"] == AccountType.TEAM.value:
        orgs = await supabase.select("organizations", filters={"owner_id": user["id"]})
        if orgs:
            org_id = orgs[0]["id"]
            
    # Create tokens
    token_data = {
        "sub": user["id"],
        "email": user["email"],
        "account_type": user["account_type"],
        "organization_id": org_id
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(user["id"])
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_expiration_minutes * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshTokenRequest,
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Refresh access token using a valid refresh token.
    """
    settings = get_settings()
    
    payload = decode_access_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = await supabase.select_one("users", user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    token_data = {
        "sub": user["id"],
        "email": user["email"],
        "account_type": user["account_type"],
    }
    
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(user["id"])
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.jwt_expiration_minutes * 60,
    )


@router.post("/refresh-token", response_model=TokenResponse)
async def refresh_token_alias(
    body: RefreshTokenRequest,
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Alias for /refresh to support frontend expectations.
    """
    return await refresh_token(body, supabase)


@router.get("/me", response_model=User)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Get the currently authenticated user's profile.
    """
    user = await supabase.select_one("users", current_user["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Fetch org info
    org_id = None
    if user["account_type"] == AccountType.TEAM.value:
        orgs = await supabase.select("organizations", filters={"owner_id": user["id"]})
        if orgs:
            org_id = orgs[0]["id"]
            
    return User(
        id=user["id"],
        email=user["email"],
        account_type=AccountType(user["account_type"]),
        full_name=user.get("full_name"),
        avatar_url=user.get("avatar_url"),
        organization_id=org_id,
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at"),
    )


@router.put("/me", response_model=User)
async def update_current_user_profile(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: SupabaseService = Depends(get_supabase),
):
    """
    Update the currently authenticated user's profile.
    """
    update_dict = update_data.model_dump(exclude_unset=True)
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    updated = await supabase.update("users", current_user["id"], update_dict)
    
    return User(
        id=updated["id"],
        email=updated["email"],
        account_type=AccountType(updated["account_type"]),
        full_name=updated.get("full_name"),
        avatar_url=updated.get("avatar_url"),
        created_at=updated.get("created_at"),
        updated_at=updated.get("updated_at"),
    )
