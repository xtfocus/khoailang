import json
import httpx
from typing import Any, Dict, List
from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.catalog import Catalog
from app.models.flashcard import Flashcard
from app.models.chat import Language
from app.models.quiz import Quiz, QuizType
from app.config import get_settings
from app.celery_app import validate_words_batch, generate_flashcards_batch, generate_quizzes_batch
from app.schemas.openai_schemas import (
    VALIDATE_SCHEMA,
    FLASHCARD_SCHEMA,
    WORD_TYPE_SCHEMA,
    WORD_RELATIONS_SCHEMA,
    RELATED_PHRASES_SCHEMA,
    QUIZ_TYPE_SCHEMAS,
)
from celery import group

router = APIRouter()

configs = {"app_config": get_settings()}
clients = {
    "openai": httpx.AsyncClient(
        base_url="https://api.openai.com/v1",
        headers={"Authorization": f"Bearer {configs['app_config'].OPENAI_API_KEY}"},
        timeout=60.0
    )
}

# Store import tasks in memory (in production, use Redis/database)
import_tasks = {}

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
        quiz_types = [quiz_type.name for quiz_type in db.query(QuizType).all()]
        
        # Create flashcards first
        flashcard_quiz_tasks = []
        for word in words:
            front = word["front"]
            back = word["back"]
            
            # Create flashcard
            flashcard = Flashcard(
                front=front,
                back=back,
                language_id=language_id,
                owner_id=current_user.id,
            )
            db.add(flashcard)
            db.flush()  # Get flashcard ID
            
            # Link to catalogs if any
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
            
            # Start quiz generation task
            task = generate_quizzes_batch.delay(
                flashcard={"front": front, "back": back},
                quiz_types=quiz_types
            )
            flashcard_quiz_tasks.append((flashcard.id, task))
            imported_words.append(front)

        db.commit()  # Commit flashcards and catalog links immediately

        # Store tasks for status checking
        task_id = f"import_{current_user.id}_{language_id}_{len(import_tasks)}"
        import_tasks[task_id] = {
            "tasks": flashcard_quiz_tasks,
            "total": len(flashcard_quiz_tasks),
            "completed": 0,
            "user_id": current_user.id,
            "language_id": language_id  # Store language_id in task info
        }

        return {
            "status": "processing",
            "task_id": task_id,
            "message": f"Started importing {len(imported_words)} words. Quizzes are being generated.",
            "imported_words": imported_words,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/import/{task_id}/status")
async def get_import_status(
    task_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Check the status of an import task"""
    if task_id not in import_tasks:
        raise HTTPException(status_code=404, detail="Import task not found")
    
    task_info = import_tasks[task_id]
    if task_info["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to check this import task")

    # Check task status and save completed quizzes
    try:
        # Get quiz type IDs mapping
        quiz_type_map = {
            qt.name: qt.id 
            for qt in db.query(QuizType).all()
        }
        
        completed = 0
        for flashcard_id, task in task_info["tasks"]:
            if task.ready():
                if not task.failed():
                    # Save quizzes if not already saved
                    quizzes = task.get()
                    for quiz_data in quizzes:
                        quiz = Quiz(
                            flashcard_id=flashcard_id,
                            quiz_type_id=quiz_type_map[quiz_data["type"]],
                            content=json.dumps(quiz_data["content"]),
                            user_id=current_user.id,  # Use user_id instead of owner_id
                            language_id=task_info["language_id"]
                        )
                        db.add(quiz)
                completed += 1

        task_info["completed"] = completed
        progress = (completed / task_info["total"]) * 100

        if completed == task_info["total"]:
            db.commit()
            # Clean up completed task
            del import_tasks[task_id]
            return {
                "status": "completed",
                "progress": 100,
                "message": "Import completed successfully"
            }
        
        return {
            "status": "processing",
            "progress": progress,
            "message": f"Processing... {completed}/{task_info['total']} words completed"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

async def detect_word_type(word: str, meaning: str) -> Dict:
    response = await clients["openai"].responses.create(
        model=configs["app_config"].OPENAI_MODEL,
        input=[
            {
                "role": "system",
                "content": "You are a language analysis assistant. Determine if the given text is a single word or a phrase.",
            },
            {"role": "user", "content": f"Text: {word}\nMeaning: {meaning}"},
        ],
        text={
            "format": {
                "type": "json_schema", 
                "name": "word_type",
                "schema": WORD_TYPE_SCHEMA,
                "strict": True,
            }
        },
    )
    return json.loads(response.output[0].content[0].text)

async def get_word_relations(word: str, meaning: str) -> Dict:
    response = await clients["openai"].responses.create(
        model=configs["app_config"].OPENAI_MODEL,
        input=[
            {
                "role": "system",
                "content": "You are a language assistant. Generate synonyms and antonyms for the given word.",
            },
            {"role": "user", "content": f"Word: {word}\nMeaning: {meaning}"},
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "word_relations",
                "schema": WORD_RELATIONS_SCHEMA,
                "strict": True,
            }
        },
    )
    return json.loads(response.output[0].content[0].text)

async def get_related_phrases(word: str, meaning: str) -> Dict:
    response = await clients["openai"].responses.create(
        model=configs["app_config"].OPENAI_MODEL,
        input=[
            {
                "role": "system",
                "content": "You are a language assistant. Generate phrases or proverbs that share meaning with the given word.",
            },
            {"role": "user", "content": f"Word: {word}\nMeaning: {meaning}"},
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "related_phrases",
                "schema": RELATED_PHRASES_SCHEMA,
                "strict": True,
            }
        },
    )
    return json.loads(response.output[0].content[0].text)

async def generate_quiz(quiz_type: str, word: str, meaning: str, word_info: Dict = None) -> Dict:
    schema = QUIZ_TYPE_SCHEMAS[quiz_type]
    system_prompt = "You are a quiz generation assistant. Generate a quiz based on the given word and its meaning."
    
    if quiz_type in ["Synonym Selection (Multiple-Choice)", "Antonym Selection (Multiple-Choice)"]:
        if not word_info or "synonyms" not in word_info or "antonyms" not in word_info:
            return None
        additional_context = f"\nSynonyms: {', '.join(word_info['synonyms'])}\nAntonyms: {', '.join(word_info['antonyms'])}"
    elif quiz_type in ["Word to Proverb (Multiple-Choice)", "Proverb to Word (Multiple-Choice)", "Proverb to Word (Cloze)"]:
        if not word_info or "phrases" not in word_info:
            return None
        additional_context = f"\nRelated Phrases: {json.dumps(word_info['phrases'])}"
    else:
        additional_context = ""

    response = await clients["openai"].responses.create(
        model=configs["app_config"].OPENAI_MODEL,
        input=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {"role": "user", "content": f"Word: {word}\nMeaning: {meaning}{additional_context}\nQuiz Type: {quiz_type}"},
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "quiz",
                "schema": schema,
                "strict": True,
            }
        },
    )
    return json.loads(response.output[0].content[0].text)
