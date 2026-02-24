"""
Pydantic models for user-related schemas.
"""
from enum import Enum
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from pydantic.alias_generators import to_camel


class AccountType(str, Enum):
    """User account type determining access level."""
    TEAM = "team"
    COACH = "coach"
    PERSONAL = "personal"


class UserBase(BaseModel):
    """Base user fields."""
    email: EmailStr
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )


class UserCreate(UserBase):
    """Request schema for user registration."""
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    account_type: AccountType = Field(..., description="Account type: 'team' or 'personal'")
    full_name: Optional[str] = Field(None, max_length=100)


class UserLogin(BaseModel):
    """Request schema for user login."""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Request schema for updating user profile."""
    full_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    staff_role: Optional[str] = None


class User(UserBase):
    """Complete user model returned from API."""
    id: UUID
    account_type: AccountType
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    organization_id: Optional[UUID] = None
    staff_role: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class UserInDB(User):
    """User model with hashed password for internal use."""
    hashed_password: str


class TokenResponse(BaseModel):
    """Response schema for authentication tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Token expiration in seconds")
    user: Optional[User] = None

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )


class RefreshTokenRequest(BaseModel):
    """Request schema for refreshing access tokens."""
    refresh_token: str
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )


class TokenPayload(BaseModel):
    """JWT token payload schema."""
    sub: str  # User ID
    email: str
    account_type: AccountType
    organization_id: Optional[str] = None
    exp: datetime

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
