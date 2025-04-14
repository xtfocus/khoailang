from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from app.database import Base

class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    allow_duplicates = Column(Boolean, default=False)
    default_visibility = Column(String(20), default="private")
    preferred_languages = Column(Text, nullable=True)  # JSON or comma-separated values
    ui_preferences = Column(Text, nullable=True)  # JSON for UI preferences