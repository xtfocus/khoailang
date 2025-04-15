from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Flashcard(Base):
    __tablename__ = "flashcards"
    
    id = Column(Integer, primary_key=True, index=True)
    front = Column(Text, nullable=False)  # The word being learned
    back = Column(Text, nullable=True)   # The translation or meaning
    language_id = Column(Integer, ForeignKey("languages.id", ondelete="RESTRICT"), nullable=False)  # Reference to languages table
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="owned_flashcards")
    catalogs = relationship("Catalog", secondary="catalog_flashcards", back_populates="flashcards")
    language = relationship("Language")