from sqlalchemy import Column, Integer, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base

class FlashcardShare(Base):
    __tablename__ = "flashcard_shares"

    flashcard_id = Column(Integer, ForeignKey("flashcards.id", ondelete="CASCADE"), primary_key=True)
    shared_with_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    can_modify = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class CatalogShare(Base):
    __tablename__ = "catalog_shares"

    catalog_id = Column(Integer, ForeignKey("catalogs.id", ondelete="CASCADE"), primary_key=True)
    shared_with_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    can_modify = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())