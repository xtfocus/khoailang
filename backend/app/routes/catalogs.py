from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.catalog import Catalog, CatalogFlashcard
from app.models.flashcard import Flashcard
from app.models.sharing import FlashcardShare
from app.models.chat import Language
from app.dependencies.auth import get_current_user
from app.schemas.catalog import CatalogCreate, CatalogResponse, CatalogBase
from typing import List

router = APIRouter()

@router.get("/owned", response_model=List[CatalogBase])
async def get_owned_catalogs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    catalogs = db.query(Catalog)\
        .filter(Catalog.owner_id == current_user.id)\
        .all()
    
    return catalogs

@router.get("/accessible-flashcards/{language_id}")
async def get_accessible_flashcards(
    language_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all flashcards the user has access to for a specific language"""
    # Verify language exists
    language = db.query(Language).filter(Language.id == language_id).first()
    if not language:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid language ID"
        )

    # Get user's own flashcards with author info and language
    owned_flashcards = db.query(Flashcard)\
        .join(Language, Language.id == Flashcard.language_id)\
        .filter(
            Flashcard.owner_id == current_user.id,
            Flashcard.language_id == language_id
        ).all()

    # Get shared flashcards with author info and language
    shared_flashcards = db.query(Flashcard)\
        .join(Language, Language.id == Flashcard.language_id)\
        .join(FlashcardShare, FlashcardShare.flashcard_id == Flashcard.id)\
        .filter(
            FlashcardShare.shared_with_id == current_user.id,
            Flashcard.language_id == language_id
        ).all()

    # Combine and deduplicate flashcards
    seen_ids = set()
    accessible_flashcards = []

    def format_flashcard(flashcard, is_owner=True):
        return {
            "id": flashcard.id,
            "front": flashcard.front,
            "back": flashcard.back,
            "language": {
                "id": flashcard.language.id,
                "name": flashcard.language.name,
            },
            "is_owner": is_owner
        }

    # Add owned flashcards
    for flashcard in owned_flashcards:
        if (flashcard.id not in seen_ids):
            seen_ids.add(flashcard.id)
            accessible_flashcards.append(format_flashcard(flashcard, True))

    # Add shared flashcards
    for flashcard in shared_flashcards:
        if (flashcard.id not in seen_ids):
            seen_ids.add(flashcard.id)
            accessible_flashcards.append(format_flashcard(flashcard, False))

    return accessible_flashcards

@router.post("/create", response_model=CatalogResponse)
async def create_catalog(
    catalog: CatalogCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verify target language exists
    language = db.query(Language).filter(Language.id == catalog.target_language_id).first()
    if not language:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid target language"
        )

    # Verify user has access to all flashcards and they are in the correct language
    flashcards = db.query(Flashcard).filter(
        Flashcard.id.in_(catalog.flashcard_ids),
        Flashcard.language_id == catalog.target_language_id,
        (
            (Flashcard.owner_id == current_user.id) |  # Own flashcards
            Flashcard.id.in_(  # Shared flashcards
                db.query(FlashcardShare.flashcard_id)
                .filter(FlashcardShare.shared_with_id == current_user.id)
            )
        )
    ).all()

    if len(flashcards) != len(catalog.flashcard_ids):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid flashcards selection. Make sure you have access to all selected flashcards and they match the target language."
        )

    # Check for word uniqueness using front values (source language words)
    word_counts = {}
    for f in flashcards:
        if f.front in word_counts:
            word_counts[f.front].append(f.id)
        else:
            word_counts[f.front] = [f.id]

    duplicates = {word: ids for word, ids in word_counts.items() if len(ids) > 1}
    if duplicates:
        # Format duplicate details for the error message
        duplicate_details = [
            f"'{word}' (flashcard IDs: {', '.join(map(str, ids))})"
            for word, ids in duplicates.items()
        ]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Duplicate words found: {'; '.join(duplicate_details)}"
        )

    # Create catalog
    new_catalog = Catalog(
        name=catalog.name,
        owner_id=current_user.id,
        visibility="private",  # Default to private
    )
    db.add(new_catalog)
    db.flush()  # Get the ID without committing

    # Add flashcards to catalog
    for flashcard_id in catalog.flashcard_ids:
        catalog_flashcard = CatalogFlashcard(
            catalog_id=new_catalog.id,
            flashcard_id=flashcard_id
        )
        db.add(catalog_flashcard)

    db.commit()
    db.refresh(new_catalog)
    return new_catalog