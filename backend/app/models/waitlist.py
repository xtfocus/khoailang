from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base

class Waitlist(Base):
    __tablename__ = "waitlist"
    __table_args__ = {"extend_existing": True}  # Allow redefinition if already defined

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    reason = Column(String, nullable=True)
    password = Column(String, nullable=False)  # Store hashed password
    approved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())