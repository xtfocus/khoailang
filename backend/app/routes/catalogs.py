from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.catalog import Catalog, CatalogFlashcard, CatalogVisibility, UserCatalogCollection
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
        .options(
            joinedload(Catalog.owner),
            joinedload(Catalog.target_language)
        )\
        .filter(Catalog.owner_id == current_user.id)\
        .all()
    
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

@router.get("/public", response_model=List[CatalogBase])
async def get_public_catalogs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all public catalogs"""
    catalogs = db.query(Catalog)\
        .options(
            joinedload(Catalog.owner),
            joinedload(Catalog.target_language)
        )\
        .filter(Catalog.visibility == CatalogVisibility.PUBLIC)\
        .all()
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
            "target_language": catalog.target_language.name,
            "is_in_collection": db.query(UserCatalogCollection)\
                .filter(
                    UserCatalogCollection.user_id == current_user.id,
                    UserCatalogCollection.catalog_id == catalog.id
                ).first() is not None
        }
        for catalog in catalogs
    ]

@router.get("/shared", response_model=List[CatalogBase])
async def get_shared_catalogs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get catalogs shared with the current user"""
    catalogs = db.query(Catalog)\
        .options(
            joinedload(Catalog.owner),
            joinedload(Catalog.target_language)
        )\
        .filter(
            Catalog.id.in_(
                db.query(CatalogShare.catalog_id)
                .filter(CatalogShare.shared_with_id == current_user.id)
            )
        )\
        .all()
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

@router.get("/collection", response_model=List[CatalogBase])
async def get_user_collection(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all catalogs in user's collection (owned + shared + added public)"""
    catalogs = db.query(Catalog)\
        .options(
            joinedload(Catalog.owner),
            joinedload(Catalog.target_language)
        )\
        .filter(
            or_(
                Catalog.owner_id == current_user.id,  # Owned catalogs
                Catalog.id.in_(  # Shared catalogs
                    db.query(CatalogShare.catalog_id)
                    .filter(CatalogShare.shared_with_id == current_user.id)
                ),
                Catalog.id.in_(  # Added public catalogs
                    db.query(UserCatalogCollection.catalog_id)
                    .filter(UserCatalogCollection.user_id == current_user.id)
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

@router.get("/accessible-by-language/{language_id}", response_model=List[CatalogBase])
async def get_accessible_catalogs_by_language(
    language_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all catalogs the user owns (can edit) that contain flashcards in the specified language"""
    catalogs = db.query(Catalog)\
        .options(
            joinedload(Catalog.owner),
            joinedload(Catalog.target_language)
        )\
        .filter(
            Catalog.owner_id == current_user.id,  # Only return owned catalogs
            # Filter by catalogs that have at least one flashcard in the specified language
            Catalog.id.in_(
                db.query(CatalogFlashcard.catalog_id)
                .join(Flashcard)
                .filter(Flashcard.language_id == language_id)
                .distinct()
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
            description=catalog.description,
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

@router.post("/{catalog_id}/add-to-collection")
async def add_to_collection(
    catalog_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a public catalog to user's collection"""
    # Verify catalog exists and is public
    catalog = db.query(Catalog).filter(
        Catalog.id == catalog_id,
        Catalog.visibility == CatalogVisibility.PUBLIC
    ).first()

    if not catalog:
        raise HTTPException(
            status_code=404,
            detail="Catalog not found or is not public"
        )

    # Check if already in collection
    existing = db.query(UserCatalogCollection).filter(
        UserCatalogCollection.user_id == current_user.id,
        UserCatalogCollection.catalog_id == catalog_id
    ).first()

    if existing:
        return {"message": "Catalog already in collection"}

    # Add to collection
    collection_entry = UserCatalogCollection(
        user_id=current_user.id,
        catalog_id=catalog_id
    )
    db.add(collection_entry)

    try:
        db.commit()
        return {"message": "Catalog added to collection"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to add catalog to collection"
        )

@router.delete("/{catalog_id}/remove-from-collection")
async def remove_from_collection(
    catalog_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a catalog from user's collection"""
    # Delete collection entry if exists
    result = db.query(UserCatalogCollection).filter(
        UserCatalogCollection.user_id == current_user.id,
        UserCatalogCollection.catalog_id == catalog_id
    ).delete()

    if result == 0:
        raise HTTPException(
            status_code=404,
            detail="Catalog not found in collection"
        )

    try:
        db.commit()
        return {"message": "Catalog removed from collection"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to remove catalog from collection"
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

@router.delete("/{catalog_id}")
async def delete_catalog(
    catalog_id: int,
    delete_flashcards: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a catalog and optionally its associated flashcards"""
    # Verify catalog exists and is owned by current user
    catalog = db.query(Catalog).filter(
        Catalog.id == catalog_id,
        Catalog.owner_id == current_user.id
    ).first()

    if not catalog:
        raise HTTPException(
            status_code=404,
            detail="Catalog not found or you don't have permission to delete it"
        )

    try:
        if delete_flashcards:
            # Delete flashcards owned by the user in this catalog
            flashcard_ids = [f.id for f in catalog.flashcards if f.owner_id == current_user.id]
            if flashcard_ids:
                db.query(Flashcard).filter(Flashcard.id.in_(flashcard_ids)).delete(synchronize_session=False)
        
        # Delete the catalog (this will automatically delete catalog_flashcards entries due to CASCADE)
        db.delete(catalog)
        db.commit()
        
        return {
            "message": f"Catalog '{catalog.name}' deleted successfully" + 
                      (f" along with {len(flashcard_ids)} flashcards" if delete_flashcards else "")
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to delete catalog"
        )

@router.delete("/{catalog_id}/flashcards/{flashcard_id}")
async def remove_flashcard_from_catalog(
    catalog_id: int,
    flashcard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a flashcard from a catalog (owner only)"""
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

    # Remove the flashcard from the catalog
    result = db.query(CatalogFlashcard).filter(
        CatalogFlashcard.catalog_id == catalog_id,
        CatalogFlashcard.flashcard_id == flashcard_id
    ).delete()

    if result == 0:
        raise HTTPException(
            status_code=404,
            detail="Flashcard not found in this catalog"
        )

    try:
        db.commit()
        return {"message": "Flashcard removed from catalog successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to remove flashcard from catalog"
        )