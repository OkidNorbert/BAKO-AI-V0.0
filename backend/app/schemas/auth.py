"""
Authentication schemas.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole


class UserCreate(BaseModel):
    """User registration schema."""
    email: EmailStr
    password: str
    role: UserRole = UserRole.PLAYER


class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str
    user_id: int
    role: UserRole
