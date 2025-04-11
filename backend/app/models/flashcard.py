from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    front = Column(Text, nullable=False)  # The word/phrase in the target language
    back = Column(Text, nullable=False)   # The translation or meaning
    language = Column(String(50), nullable=False)  # The language of the flashcard

class UserFlashcard(Base):
    __tablename__ = "user_flashcards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    flashcard_id = Column(Integer, ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False)
    memory_strength = Column(Float, default=0.0)
    last_reviewed = Column(DateTime(timezone=True))
    next_review = Column(DateTime(timezone=True))

    user = relationship("User", back_populates="flashcards")
    flashcard = relationship("Flashcard")