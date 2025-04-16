from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Catalog(Base):
    __tablename__ = "catalogs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    visibility = Column(String(50), default="private")
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    owner = relationship("User")
    flashcards = relationship(
        "Flashcard",
        secondary="catalog_flashcards",
        primaryjoin="Catalog.id == CatalogFlashcard.catalog_id",
        secondaryjoin="CatalogFlashcard.flashcard_id == Flashcard.id",
    )

    # Add unique constraint for name per user
    __table_args__ = (
        UniqueConstraint('name', 'owner_id', name='uq_catalog_name_owner'),
    )

class CatalogFlashcard(Base):
    __tablename__ = "catalog_flashcards"

    id = Column(Integer, primary_key=True, index=True)
    catalog_id = Column(Integer, ForeignKey("catalogs.id", ondelete="CASCADE"), nullable=False)
    flashcard_id = Column(Integer, ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False)