from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, func, distinct, and_
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Flashcard, UserFlashcard, User
from app.models.catalog import CatalogFlashcard, Catalog, UserCatalogCollection, CatalogVisibility
from app.models.sharing import CatalogShare
from app.dependencies.auth import get_current_user
from typing import List

router = APIRouter()

@router.get("/all")
async def get_all_flashcards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all flashcards the user has access to (owned + from accessible catalogs)"""
    # Get accessible catalog IDs
    accessible_catalog_ids = db.query(Catalog.id).filter(
        or_(
            Catalog.owner_id == current_user.id,  # Owned catalogs
            Catalog.visibility == "public",  # Public catalogs
            Catalog.id.in_(  # Shared catalogs
                db.query(CatalogShare.catalog_id)
                .filter(CatalogShare.shared_with_id == current_user.id)
            )
        )
    ).all()
    accessible_catalog_ids = [c[0] for c in accessible_catalog_ids]

    # Get all flashcards from accessible catalogs
    flashcards = db.query(Flashcard)\
        .outerjoin(CatalogFlashcard)\
        .filter(
            or_(
                Flashcard.owner_id == current_user.id,  # Owned flashcards
                CatalogFlashcard.catalog_id.in_(accessible_catalog_ids)  # Flashcards from accessible catalogs
            )
        ).distinct().all()

    return [
        {
            "id": f.id,
            "front": f.front,
            "back": f.back,
            "isOwner": f.owner_id == current_user.id,
            "language": {
                "id": f.language_id,
                "name": f.language.name
            } if f.language else None,
            "authorName": f.owner.username or f.owner.email.split('@')[0]
        }
        for f in flashcards
    ]

@router.get("/stats")
async def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's flashcard statistics"""
    # Count owned flashcards
    owned_count = db.query(func.count(Flashcard.id)).filter(
        Flashcard.owner_id == current_user.id
    ).scalar()

    # Count owned catalogs
    owned_catalogs = db.query(func.count(Catalog.id)).filter(
        Catalog.owner_id == current_user.id
    ).scalar()

    # Count shared catalogs (catalogs shared with current user)
    shared_catalogs = db.query(func.count(Catalog.id)).filter(
        Catalog.id.in_(
            db.query(CatalogShare.catalog_id)
            .filter(CatalogShare.shared_with_id == current_user.id)
        )
    ).scalar()

    # Get accessible catalog IDs (public + shared)
    accessible_catalog_ids = db.query(Catalog.id).filter(
        or_(
            Catalog.visibility == "public",
            Catalog.id.in_(
                db.query(CatalogShare.catalog_id)
                .filter(CatalogShare.shared_with_id == current_user.id)
            )
        )
    ).all()
    accessible_catalog_ids = [c[0] for c in accessible_catalog_ids]

    # Count shared flashcards (cards from accessible catalogs that user doesn't own)
    shared_count = db.query(func.count(distinct(Flashcard.id)))\
        .join(CatalogFlashcard)\
        .filter(
            Flashcard.owner_id != current_user.id,
            CatalogFlashcard.catalog_id.in_(accessible_catalog_ids)
        ).scalar()

    # Get cards due for review 
    cards_to_review = db.query(func.count(UserFlashcard.id)).filter(
        UserFlashcard.user_id == current_user.id,
        UserFlashcard.next_review <= func.now()
    ).scalar()

    # Calculate average memory strength
    avg_level = db.query(func.avg(UserFlashcard.memory_strength)).filter(
        UserFlashcard.user_id == current_user.id
    ).scalar()

    return {
        "totalCards": owned_count + shared_count,
        "ownedCards": owned_count,
        "sharedCards": shared_count,
        "cardsToReview": cards_to_review or 0,
        "averageLevel": float(avg_level or 0),
        "streak": 0,  # To be implemented later
        "totalCatalogs": owned_catalogs + shared_catalogs,
        "ownedCatalogs": owned_catalogs,
        "sharedCatalogs": shared_catalogs
    }

@router.get("/collection/count")
async def get_collection_flashcard_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get total number of unique flashcards from user's collection"""
    # Get count of all flashcards that are either:
    # 1. Owned by the user (regardless of catalog membership)
    # 2. From public catalogs in user's collection
    count = db.query(func.count(distinct(Flashcard.id)))\
        .outerjoin(CatalogFlashcard)\
        .outerjoin(Catalog)\
        .outerjoin(UserCatalogCollection)\
        .filter(
            or_(
                Flashcard.owner_id == current_user.id,  # All owned flashcards
                and_(
                    Catalog.visibility == CatalogVisibility.PUBLIC,  # From public catalogs
                    UserCatalogCollection.user_id == current_user.id  # That are in user's collection
                )
            )
        ).scalar()

    return {"count": count or 0}

@router.get("/collection")
async def get_collection_flashcards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all owned flashcards plus unique flashcards from user's collection"""
    # Query all flashcards that are either:
    # 1. Owned by the user (regardless of catalog membership)
    # 2. In catalogs that are in user's collection
    flashcards = db.query(Flashcard)\
        .outerjoin(CatalogFlashcard)\
        .outerjoin(Catalog)\
        .outerjoin(UserCatalogCollection)\
        .filter(
            or_(
                Flashcard.owner_id == current_user.id,  # All owned flashcards
                and_(
                    Catalog.visibility == CatalogVisibility.PUBLIC,  # From public catalogs
                    UserCatalogCollection.user_id == current_user.id  # That are in user's collection
                )
            )
        )\
        .distinct()\
        .all()

    return [
        {
            "id": f.id,
            "front": f.front,
            "back": f.back,
            "isOwner": f.owner_id == current_user.id,
            "language": {
                "id": f.language_id,
                "name": f.language.name
            } if f.language else None,
            "authorName": f.owner.username or f.owner.email.split('@')[0]
        }
        for f in flashcards
    ]

@router.post("/delete")
async def delete_flashcards(
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete owned flashcards only"""
    flashcard_ids = request.get("flashcardIds", [])
    if not flashcard_ids:
        raise HTTPException(status_code=400, detail="No flashcard IDs provided")

    # Get all relevant flashcards that user owns
    flashcards = db.query(Flashcard).filter(
        Flashcard.id.in_(flashcard_ids),
        Flashcard.owner_id == current_user.id
    ).all()

    if not flashcards:
        raise HTTPException(status_code=404, detail="No flashcards found or you don't have permission to delete them")

    try:
        for flashcard in flashcards:
            db.delete(flashcard)
        db.commit()
        return {"message": "Flashcards deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete flashcards")
