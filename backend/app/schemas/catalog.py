from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from app.models.catalog import CatalogVisibility

class CatalogCreate(BaseModel):
    name: str
    target_language_id: int
    flashcard_ids: List[int]
    visibility: CatalogVisibility = CatalogVisibility.PRIVATE

class CatalogVisibilityUpdate(BaseModel):
    visibility: CatalogVisibility

class CatalogFlashcardBase(BaseModel):
    id: int
    front: str
    back: str
    language: str
    
    class Config:
        from_attributes = True

class CatalogOwner(BaseModel):
    username: Optional[str]
    email: str

    class Config:
        from_attributes = True

class CatalogBase(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    visibility: CatalogVisibility
    created_at: datetime
    owner: CatalogOwner

    class Config:
        from_attributes = True

class CatalogDetailResponse(CatalogBase):
    is_owner: bool
    flashcards: List[CatalogFlashcardBase]

class CatalogResponse(CatalogBase):
    flashcards: List[CatalogFlashcardBase]
    notification: Optional[Dict[str, str]] = None