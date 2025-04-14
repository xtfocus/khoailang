from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.database import Base

class Catalog(Base):
    __tablename__ = "catalogs"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    visibility = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Add relationship
    flashcards = relationship("Flashcard", secondary="catalog_flashcards", back_populates="catalogs")

class CatalogFlashcard(Base):
    __tablename__ = "catalog_flashcards"

    catalog_id = Column(Integer, ForeignKey("catalogs.id", ondelete="CASCADE"), primary_key=True)
    flashcard_id = Column(Integer, ForeignKey("flashcards.id", ondelete="CASCADE"), primary_key=True)
    added_at = Column(TIMESTAMP(timezone=True), server_default=func.now())