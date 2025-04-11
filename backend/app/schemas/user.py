from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None  # Username is optional
    is_admin: bool = False


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: EmailStr  # use email as username
    password: str


class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class WaitlistSchema(BaseModel):
    id: int
    email: str
    name: str
    reason: Optional[str]
    approved: bool
    created_at: datetime

    class Config:
        orm_mode = True
