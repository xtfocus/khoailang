from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.flashcard import Flashcard
from app.models.catalog import Catalog
from app.dependencies.auth import get_current_user

router = APIRouter()

@router.post("/txt/extract")
async def extract_words_from_txt(file: UploadFile = File(...)):
    if not file.filename.endswith('.txt'):
        raise HTTPException(status_code=400, detail="Only .txt files are supported")
    content = await file.read()
    words = content.decode().splitlines()
    words = [w.strip() for w in words if w.strip()]
    return {"words": words}

@router.post("/check-duplicates")
async def check_duplicates(
    words: List[str],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Query existing words for the current user
    existing_words = db.query(Flashcard.front)\
        .filter(Flashcard.owner_id == current_user.id)\
        .filter(Flashcard.front.in_(words))\
        .all()
    
    duplicates = [word[0] for word in existing_words]
    
    return {
        "duplicates": duplicates,
        "has_duplicates": len(duplicates) > 0
    }

@router.post("/import")
async def import_words(
    words: List[str],
    catalog_ids: List[int],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Create flashcards
        imported_words = []
        for word in words:
            flashcard = Flashcard(
                front=word,
                owner_id=current_user.id
            )
            db.add(flashcard)
            db.flush()  # Get the ID without committing
            
            # Link to catalogs if specified
            if catalog_ids:
                # Check catalog ownership
                for catalog_id in catalog_ids:
                    catalog = db.query(Catalog).filter(
                        Catalog.id == catalog_id,
                        Catalog.owner_id == current_user.id
                    ).first()
                    
                    if catalog:
                        flashcard.catalogs.append(catalog)
            
            imported_words.append(word)
        
        db.commit()
        
        return {
            "status": "success",
            "imported_count": len(imported_words),
            "imported_words": imported_words
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))