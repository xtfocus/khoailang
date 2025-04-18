from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, UniqueConstraint, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class CatalogVisibility(str, enum.Enum):
    PUBLIC = "public"     # Anyone can view
    PRIVATE = "private"   # Only shared users can view

class Catalog(Base):
    __tablename__ = "catalogs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    visibility = Column(Enum(CatalogVisibility), default=CatalogVisibility.PRIVATE, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_language_id = Column(Integer, ForeignKey("languages.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    owner = relationship("User")
    target_language = relationship("Language")
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

class UserCatalogCollection(Base):
    __tablename__ = "user_catalog_collections"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    catalog_id = Column(Integer, ForeignKey("catalogs.id", ondelete="CASCADE"), primary_key=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="collected_catalogs")
    catalog = relationship("Catalog")

    __table_args__ = (
        UniqueConstraint('user_id', 'catalog_id', name='uq_user_catalog_collection'),
    )