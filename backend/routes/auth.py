from fastapi import APIRouter
from pydantic import BaseModel

# Define a router for authentication-related routes
auth_router = APIRouter()

# Define a Pydantic model for the waitlist request body
class WaitlistEntry(BaseModel):
    name: str
    email: str
    reason: str
    phone: str