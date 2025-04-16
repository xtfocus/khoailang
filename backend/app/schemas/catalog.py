from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class CatalogCreate(BaseModel):
    name: str
    target_language_id: int
    flashcard_ids: List[int]

class CatalogFlashcardBase(BaseModel):
    id: int
    front: str
    back: str
    language: str  # Changed from Language object to string
    
    class Config:
        from_attributes = True

class CatalogBase(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    visibility: str
    created_at: datetime

    class Config:
        from_attributes = True

class CatalogResponse(CatalogBase):
    flashcards: List[CatalogFlashcardBase]
    notification: Optional[Dict[str, str]] = None