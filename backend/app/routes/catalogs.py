from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.catalog import Catalog, CatalogFlashcard, CatalogVisibility
from app.models.flashcard import Flashcard
from app.models.sharing import CatalogShare
from app.models.chat import Language
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.schemas.catalog import CatalogCreate, CatalogResponse, CatalogBase, CatalogVisibilityUpdate, CatalogDetailResponse
from typing import List, Dict

router = APIRouter()

@router.get("/owned", response_model=List[CatalogBase])
async def get_owned_catalogs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get catalogs owned by the current user"""
    catalogs = db.query(Catalog)\
        .filter(Catalog.owner_id == current_user.id)\
        .all()
    return catalogs

@router.get("/accessible", response_model=List[CatalogBase])
async def get_accessible_catalogs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all catalogs the user can access (owned + shared + public)"""
    catalogs = db.query(Catalog)\
        .options(
            joinedload(Catalog.owner),
            joinedload(Catalog.target_language)
        )\
        .filter(
            or_(
                Catalog.owner_id == current_user.id,  # Owned catalogs
                Catalog.visibility == CatalogVisibility.PUBLIC,  # Public catalogs
                Catalog.id.in_(  # Shared catalogs
                    db.query(CatalogShare.catalog_id)
                    .filter(CatalogShare.shared_with_id == current_user.id)
                )
            )
        ).all()
    
    return [
        {
            "id": catalog.id,
            "name": catalog.name,
            "description": catalog.description,
            "visibility": catalog.visibility,
            "created_at": catalog.created_at,
            "owner": {
                "username": catalog.owner.username,
                "email": catalog.owner.email
            },
            "target_language": catalog.target_language.name
        }
        for catalog in catalogs
    ]

@router.get("/accessible-flashcards/{language_id}")
async def get_accessible_flashcards(
    language_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all flashcards the user owns for a specific language"""
    flashcards = db.query(Flashcard)\
        .filter(
            Flashcard.language_id == language_id,
            Flashcard.owner_id == current_user.id  # Only return owned flashcards
        ).all()
    
    return flashcards

@router.post("/create", response_model=CatalogResponse)
async def create_catalog(
    catalog: CatalogCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new catalog"""
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
        Flashcard.owner_id == current_user.id  # Only allow adding owned flashcards
    ).all()

    if len(flashcards) != len(catalog.flashcard_ids):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid flashcards selection. Make sure you own all selected flashcards and they match the target language."
        )

    # Check for word uniqueness using front values
    word_counts = {}
    for f in flashcards:
        if f.front in word_counts:
            word_counts[f.front].append(f.id)
        else:
            word_counts[f.front] = [f.id]

    duplicates = {word: ids for word, ids in word_counts.items() if len(ids) > 1}
    if duplicates:
        duplicate_details = [
            f"'{word}' (flashcard IDs: {', '.join(map(str, ids))})"
            for word, ids in duplicates.items()
        ]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Duplicate words found: {'; '.join(duplicate_details)}"
        )

    try:
        # Create catalog
        new_catalog = Catalog(
            name=catalog.name,
            owner_id=current_user.id,
            target_language_id=catalog.target_language_id,
            visibility=catalog.visibility,
        )
        db.add(new_catalog)
        db.flush()

        # Add flashcards to catalog
        for flashcard_id in catalog.flashcard_ids:
            catalog_flashcard = CatalogFlashcard(
                catalog_id=new_catalog.id,
                flashcard_id=flashcard_id
            )
            db.add(catalog_flashcard)

        db.commit()
        db.refresh(new_catalog)

        # Format response
        response = {
            "id": new_catalog.id,
            "name": new_catalog.name,
            "description": new_catalog.description,
            "visibility": new_catalog.visibility,
            "created_at": new_catalog.created_at,
            "owner": {
                "username": current_user.username,
                "email": current_user.email
            },
            "target_language": language.name,
            "flashcards": [
                {
                    "id": f.id,
                    "front": f.front,
                    "back": f.back,
                    "language": f.language.name
                }
                for f in new_catalog.flashcards
            ]
        }

        response["notification"] = {
            "type": "success",
            "message": f"Catalog '{new_catalog.name}' created with {len(new_catalog.flashcards)} words"
        }

        return response

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A catalog with the name '{catalog.name}' already exists"
        )

@router.post("/share")
async def share_catalog(
    request: Dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Share a catalog with other users by email"""
    catalog_id = request.get("catalogId")
    emails = request.get("emails", [])

    if not catalog_id or not emails:
        raise HTTPException(
            status_code=400, 
            detail="Missing catalog ID or email addresses"
        )

    # Verify catalog exists and is owned by current user
    catalog = db.query(Catalog).filter(
        Catalog.id == catalog_id,
        Catalog.owner_id == current_user.id
    ).first()

    if not catalog:
        raise HTTPException(
            status_code=403,
            detail="Catalog doesn't exist or you don't have permission to share it"
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

    # Track sharing status
    already_shared = []
    newly_shared = []

    # Create shares
    for user in target_users:
        # Check if already shared
        existing_share = db.query(CatalogShare).filter(
            CatalogShare.catalog_id == catalog.id,
            CatalogShare.shared_with_id == user.id
        ).first()
        
        if existing_share:
            already_shared.append(user.email)
        else:
            share = CatalogShare(
                catalog_id=catalog.id,
                shared_with_id=user.id
            )
            db.add(share)
            newly_shared.append(user.email)

    try:
        db.commit()
        return {
            "message": "Catalog sharing status",
            "details": {
                "newlyShared": newly_shared,
                "alreadyShared": already_shared
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to share catalog"
        )

@router.patch("/{catalog_id}/visibility")
async def update_catalog_visibility(
    catalog_id: int,
    visibility_update: CatalogVisibilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update catalog visibility (public/private)"""
    # Verify catalog exists and is owned by current user
    catalog = db.query(Catalog).filter(
        Catalog.id == catalog_id,
        Catalog.owner_id == current_user.id
    ).first()

    if not catalog:
        raise HTTPException(
            status_code=404,
            detail="Catalog not found or you don't have permission to modify it"
        )

    catalog.visibility = visibility_update.visibility
    try:
        db.commit()
        return {"message": f"Catalog visibility updated to {visibility_update.visibility}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to update catalog visibility"
        )

@router.get("/{catalog_id}", response_model=CatalogDetailResponse)
async def get_catalog_by_id(
    catalog_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a catalog by ID if user has access to it"""
    catalog = db.query(Catalog)\
        .options(
            joinedload(Catalog.flashcards).joinedload(Flashcard.language),
            joinedload(Catalog.owner),
            joinedload(Catalog.target_language)
        )\
        .filter(
            Catalog.id == catalog_id,
            or_(
                Catalog.owner_id == current_user.id,  # User owns the catalog
                Catalog.visibility == CatalogVisibility.PUBLIC,  # Catalog is public
                Catalog.id.in_(  # Catalog is shared with user
                    db.query(CatalogShare.catalog_id)
                    .filter(CatalogShare.shared_with_id == current_user.id)
                )
            )
        ).first()

    if not catalog:
        raise HTTPException(
            status_code=404,
            detail="Catalog not found or you don't have permission to access it"
        )

    return {
        "id": catalog.id,
        "name": catalog.name,
        "description": catalog.description,
        "visibility": catalog.visibility,
        "created_at": catalog.created_at,
        "owner": {
            "username": catalog.owner.username,
            "email": catalog.owner.email
        },
        "is_owner": catalog.owner_id == current_user.id,
        "target_language": catalog.target_language.name,
        "flashcards": [
            {
                "id": f.id,
                "front": f.front,
                "back": f.back,
                "language": f.language.name
            }
            for f in catalog.flashcards
        ]
    }

@router.get("/accessible-by-language/{language_id}", response_model=List[CatalogBase])
async def get_accessible_catalogs_by_language(
    language_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all catalogs the user owns (can edit) that contain flashcards in the specified language"""
    catalogs = db.query(Catalog).filter(
        Catalog.owner_id == current_user.id,  # Only return owned catalogs
        # Filter by catalogs that have at least one flashcard in the specified language
        Catalog.id.in_(
            db.query(CatalogFlashcard.catalog_id)
            .join(Flashcard)
            .filter(Flashcard.language_id == language_id)
            .distinct()
        )
    ).all()
    return catalogs