import json
from typing import Any, Dict, List
from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.catalog import Catalog
from app.models.flashcard import Flashcard
from app.models.chat import Language
from app.celery_app import validate_words_batch, generate_flashcards_batch
from celery import group

router = APIRouter()

@router.post("/txt/extract")
async def extract_words_from_txt(file: UploadFile = File(...)):
    if not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt files are supported")
    content = await file.read()
    words = content.decode().splitlines()
    words = list(set([w.strip() for w in words if w.strip()]))
    return {"words": words}

@router.post("/validate")
async def validate_words(
    words: List[str], 
    language_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Validate words using LLM in batches with Celery tasks."""
    try:
        # Get language name
        language = db.query(Language).filter(Language.id == language_id).first()
        if not language:
            raise HTTPException(status_code=400, detail="Invalid language ID")

        # Split words into batches of 10
        batches = [words[i:i+10] for i in range(0, len(words), 10)]
        
        # Create group of tasks
        job = group(validate_words_batch.s(batch, language.name) for batch in batches)
        result = job.apply_async()
        
        # Wait for all tasks to complete
        batch_results = result.get(timeout=300)  # 5 minutes timeout
        
        # Combine results
        valid_words = [word for batch in batch_results for word in batch]
        return {"valid_words": valid_words}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating words: {str(e)}")

@router.post("/generate-flashcards")
async def generate_flashcards(
    words: List[str], 
    language_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Generate flashcards using LLM in batches with Celery tasks."""
    try:
        # Get language name
        language = db.query(Language).filter(Language.id == language_id).first()
        if not language:
            raise HTTPException(status_code=400, detail="Invalid language ID")

        # Split words into batches of 10
        batches = [words[i:i+10] for i in range(0, len(words), 10)]
        
        # Create group of tasks
        job = group(generate_flashcards_batch.s(batch, language.name) for batch in batches)
        result = job.apply_async()
        
        # Wait for all tasks to complete
        batch_results = result.get(timeout=300)  # 5 minutes timeout
        
        # Combine results
        flashcards = [card for batch in batch_results for card in batch]
        return {"flashcards": flashcards}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating flashcards: {str(e)}")

@router.post("/check-duplicates")
async def check_duplicates(
    words: List[str],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing_words = (
        db.query(Flashcard.front)
        .filter(Flashcard.owner_id == current_user.id)
        .filter(Flashcard.front.in_(words))
        .all()
    )
    duplicates = [word[0] for word in existing_words]
    return {"duplicates": duplicates, "has_duplicates": len(duplicates) > 0}

@router.get("/languages")
async def get_languages(db: Session = Depends(get_db)):
    """Get list of available languages"""
    try:
        languages = db.query(Language).order_by(Language.name).all()
        return {"languages": [{"id": lang.id, "name": lang.name} for lang in languages]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching languages: {str(e)}")

@router.post("/import")
async def import_words(
    language_id: int = Query(...),
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    words = body.get("words")
    catalog_ids = body.get("catalog_ids", [])

    if not words:
        raise HTTPException(status_code=400, detail="No words provided in request body")

    try:
        imported_words = []
        for word in words:
            flashcard = Flashcard(
                front=word["front"],
                back=word["back"],
                language_id=language_id,
                owner_id=current_user.id,
            )
            db.add(flashcard)
            db.flush()

            if catalog_ids:
                for catalog_id in catalog_ids:
                    catalog = (
                        db.query(Catalog)
                        .filter(
                            Catalog.id == catalog_id,
                            Catalog.owner_id == current_user.id,
                        )
                        .first()
                    )

                    if catalog:
                        flashcard.catalogs.append(catalog)

            imported_words.append(word["front"])

        db.commit()

        return {
            "status": "success",
            "imported_count": len(imported_words),
            "imported_words": imported_words,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
