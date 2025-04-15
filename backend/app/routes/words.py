import json
from asyncio import Semaphore, gather
from typing import Any, Dict, List, Optional

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.globals import clients, configs
from app.models.catalog import Catalog
from app.models.flashcard import Flashcard
from fastapi import (APIRouter, Body, Depends, File, HTTPException, Query,
                     Request, UploadFile)
from sqlalchemy.orm import Session

router = APIRouter()

# Define JSON schemas for OpenAI responses
VALIDATE_SCHEMA = {
    "type": "object",
    "properties": {"valid_words": {"type": "array", "items": {"type": "string"}}},
    "required": ["valid_words"],
    "additionalProperties": False,
}

FLASHCARD_SCHEMA = {
    "type": "object",
    "properties": {
        "flashcards": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"front": {"type": "string"}, "back": {"type": "string"}},
                "required": ["front", "back"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["flashcards"],
    "additionalProperties": False,
}


async def validate_batch(batch: list[str], semaphore: Semaphore):
    """Validate a batch of words using the LLM with semaphore control."""
    async with semaphore:
        try:
            response = await clients["openai"].responses.create(
                model=configs["app_config"].OPENAI_MODEL,
                input=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that validates words and phrases. Return only valid words or phrases.",
                    },
                    {"role": "user", "content": "\n".join(batch)},
                ],
                text={
                    "format": {
                        "type": "json_schema",
                        "name": "validation_result",
                        "schema": VALIDATE_SCHEMA,
                        "strict": True,
                    }
                },
            )
            result = json.loads(response.output[0].content[0].text)
            return result.get("valid_words", [])
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error validating words: {str(e)}"
            )


async def generate_flashcards_batch(batch: list[str], semaphore: Semaphore):
    """Generate flashcards for a batch of words using the LLM with semaphore control."""
    async with semaphore:
        try:
            response = await clients["openai"].responses.create(
                model=configs["app_config"].OPENAI_MODEL,
                input=[
                    {
                        "role": "system",
                        "content": "Generate concise definitions for the following words or phrases. Return as a JSON array of objects with 'front' (word) and 'back' (definition) properties.",
                    },
                    {"role": "user", "content": "\n".join(batch)},
                ],
                text={
                    "format": {
                        "type": "json_schema",
                        "name": "flashcards",
                        "schema": FLASHCARD_SCHEMA,
                        "strict": True,
                    }
                },
            )
            result = json.loads(response.output[0].content[0].text)
            return result.get("flashcards", [])
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Error generating flashcards: {str(e)}"
            )


@router.post("/txt/extract")
async def extract_words_from_txt(file: UploadFile = File(...)):
    if not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt files are supported")
    content = await file.read()
    words = content.decode().splitlines()
    words = list(set([w.strip() for w in words if w.strip()]))
    return {"words": words}


@router.post("/validate")
async def validate_words(words: List[str]):
    """Validate words using LLM in batches with concurrency control."""
    # Create semaphore with configured limit
    semaphore = Semaphore(configs["app_config"].OPENAI_CONCURRENT_REQUESTS)

    # Split words into batches of 10
    batches = [words[i : i + 10] for i in range(0, len(words), 10)]

    # Process batches with semaphore control
    results = await gather(*[validate_batch(batch, semaphore) for batch in batches])

    # Combine results
    valid_words = [word for batch_result in results for word in batch_result]
    return {"valid_words": valid_words}


@router.post("/generate-flashcards")
async def generate_flashcards(words: List[str]):
    """Generate flashcards for words using LLM in batches with concurrency control."""
    # Create semaphore with configured limit
    semaphore = Semaphore(configs["app_config"].OPENAI_CONCURRENT_REQUESTS)

    # Split words into batches of 10
    batches = [words[i : i + 10] for i in range(0, len(words), 10)]

    # Process batches with semaphore control
    results = await gather(
        *[generate_flashcards_batch(batch, semaphore) for batch in batches]
    )

    # Combine results
    flashcards = [card for batch_result in results for card in batch_result]
    return {"flashcards": flashcards}


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


from app.models.chat import Language


@router.get("/languages")
async def get_languages(db: Session = Depends(get_db)):
    """Get list of available languages"""
    try:
        languages = db.query(Language).order_by(Language.name).all()
        return {"languages": [{"id": lang.id, "name": lang.name} for lang in languages]}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching languages: {str(e)}"
        )


@router.post("/import")
async def import_words(
    language_id: int = Query(...),  # required query parameter
    body: Dict[str, Any] = Body(...),  # request body with words and catalog_ids
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
