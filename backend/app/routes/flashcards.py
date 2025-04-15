from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Flashcard, UserFlashcard, User
from app.models.sharing import FlashcardShare
from app.dependencies.auth import get_current_user
from typing import List

router = APIRouter()

@router.get("/all")
async def get_all_flashcards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all flashcards the user has access to (owned + shared)"""
    # Get flashcards owned by user
    owned_flashcards = db.query(
        Flashcard,
        User.username.label("author_name")
    ).join(
        User, User.id == Flashcard.owner_id
    ).filter(
        Flashcard.owner_id == current_user.id
    )

    # Get flashcards shared with user
    shared_flashcards = db.query(
        Flashcard,
        User.username.label("author_name")
    ).join(
        FlashcardShare, FlashcardShare.flashcard_id == Flashcard.id
    ).join(
        User, User.id == Flashcard.owner_id
    ).filter(
        FlashcardShare.shared_with_id == current_user.id
    )

    # Combine and format results
    all_flashcards = []
    seen_ids = set()

    def format_flashcard(flashcard, author_name):
        return {
            "id": str(flashcard.id),
            "front": flashcard.front,
            "back": flashcard.back,
            "authorName": author_name or "Unknown",
            "language": flashcard.language.name if flashcard.language else "Unknown",
            "isOwner": flashcard.owner_id == current_user.id
        }

    # Add owned flashcards
    for flashcard, author_name in owned_flashcards:
        if flashcard.id not in seen_ids:
            seen_ids.add(flashcard.id)
            all_flashcards.append(format_flashcard(flashcard, author_name))

    # Add shared flashcards
    for flashcard, author_name in shared_flashcards:
        if flashcard.id not in seen_ids:
            seen_ids.add(flashcard.id)
            all_flashcards.append(format_flashcard(flashcard, author_name))

    return {"flashcards": all_flashcards}

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

    # Count shared flashcards
    shared_count = db.query(func.count(FlashcardShare.flashcard_id)).filter(
        FlashcardShare.shared_with_id == current_user.id
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
        "cardsToReview": cards_to_review or 0,
        "averageLevel": float(avg_level or 0),
        "streak": 0  # To be implemented later
    }

@router.post("/share")
async def share_flashcards(
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Share flashcards with other users by email"""
    flashcard_ids = request.get("flashcardIds", [])
    emails = request.get("emails", [])

    if not flashcard_ids or not emails:
        raise HTTPException(status_code=400, detail="Missing flashcard IDs or email addresses")

    # Verify all flashcards exist and are owned by current user
    flashcards = db.query(Flashcard).filter(
        Flashcard.id.in_(flashcard_ids),
        Flashcard.owner_id == current_user.id
    ).all()

    if len(flashcards) != len(flashcard_ids):
        raise HTTPException(
            status_code=403,
            detail="Some flashcards don't exist or you don't have permission to share them"
        )

    # Get target users
    target_users = db.query(User).filter(
        User.email.in_(emails),
        User.is_admin == False  # Don't share with admin users
    ).all()

    invalid_emails = set(emails) - {user.email for user in target_users}
    if invalid_emails:
        raise HTTPException(
            status_code=400,
            detail=f"Users not found: {', '.join(invalid_emails)}"
        )

    already_shared = []
    newly_shared = []

    # Create shares
    for flashcard in flashcards:
        for user in target_users:
            # Check if already shared
            existing_share = db.query(FlashcardShare).filter(
                FlashcardShare.flashcard_id == flashcard.id,
                FlashcardShare.shared_with_id == user.id
            ).first()
            
            if existing_share:
                already_shared.append((flashcard.id, user.email))
            else:
                share = FlashcardShare(
                    flashcard_id=flashcard.id,
                    shared_with_id=user.id
                )
                db.add(share)
                newly_shared.append((flashcard.id, user.email))

    try:
        db.commit()
        message = {
            "newlyShared": [
                {"flashcardId": flashcard_id, "email": email} for flashcard_id, email in newly_shared
            ],
            "alreadyShared": [
                {"flashcardId": flashcard_id, "email": email} for flashcard_id, email in already_shared
            ]
        }
        return {"message": "Flashcards sharing status", "details": message}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to share flashcards")

@router.post("/delete")
async def delete_flashcards(
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete flashcards or remove access to shared flashcards"""
    flashcard_ids = request.get("flashcardIds", [])
    if not flashcard_ids:
        raise HTTPException(status_code=400, detail="No flashcard IDs provided")

    # Get all relevant flashcards
    flashcards = db.query(Flashcard).filter(Flashcard.id.in_(flashcard_ids)).all()
    if not flashcards:
        raise HTTPException(status_code=404, detail="No flashcards found")

    try:
        for flashcard in flashcards:
            if flashcard.owner_id == current_user.id:
                # If user owns the flashcard, delete it entirely
                db.delete(flashcard)
            else:
                # If it's a shared flashcard, remove the share
                share = db.query(FlashcardShare).filter(
                    FlashcardShare.flashcard_id == flashcard.id,
                    FlashcardShare.shared_with_id == current_user.id
                ).first()
                if share:
                    db.delete(share)

        db.commit()
        return {"message": "Flashcards deleted/unshared successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete flashcards")
