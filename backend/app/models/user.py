from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.flashcard import UserFlashcard
from app.models.chat import ChatbotInteraction

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)  # Email remains unique
    username = Column(String, nullable=True)  # Username is now decorative and optional
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)  # Soft delete flag
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # Track deletion time
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    flashcards = relationship("UserFlashcard", back_populates="user")
    chat_interactions = relationship("ChatbotInteraction", back_populates="user")