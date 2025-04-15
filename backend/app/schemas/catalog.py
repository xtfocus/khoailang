from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CatalogCreate(BaseModel):
    name: str
    target_language_id: int
    flashcard_ids: List[int]

class CatalogFlashcardBase(BaseModel):
    id: int
    front: str
    back: str
    language: str

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