from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class QuizType(Base):
    __tablename__ = "quiz_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    difficulty = Column(Integer, nullable=False, default=1)  # Set default value for difficulty

    quizzes = relationship("Quiz", back_populates="quiz_type")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    flashcard_id = Column(Integer, ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False)
    language_id = Column(Integer, ForeignKey("languages.id", ondelete="RESTRICT"), nullable=False)
    quiz_type_id = Column(Integer, ForeignKey("quiz_types.id", ondelete="RESTRICT"), nullable=False)
    score = Column(Float)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    quiz_type = relationship("QuizType", back_populates="quizzes")
    language = relationship("Language")