from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.quiz import Quiz, QuizType
from app.models.flashcard import Flashcard
from app.dependencies.auth import get_current_user
from datetime import datetime

router = APIRouter()

@router.post("/")
async def create_quiz(
    quiz_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new quiz attempt"""
    try:
        # Validate flashcard exists and user has access
        flashcard = db.query(Flashcard).filter(
            Flashcard.id == quiz_data["flashcard_id"],
            Flashcard.owner_id == current_user.id
        ).first()
        
        if not flashcard:
            raise HTTPException(status_code=404, detail="Flashcard not found or access denied")
        
        # Create quiz record
        quiz = Quiz(
            user_id=current_user.id,
            flashcard_id=quiz_data["flashcard_id"],
            language_id=quiz_data["language_id"],
            quiz_type_id=quiz_data["quiz_type_id"],
            score=quiz_data.get("score")
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        
        return {"message": "Quiz created successfully", "quiz_id": quiz.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/types")
async def get_quiz_types(db: Session = Depends(get_db)):
    """Get list of available quiz types"""
    try:
        quiz_types = db.query(QuizType).all()
        return {
            "quiz_types": [{"id": qt.id, "name": qt.name} for qt in quiz_types]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_quiz_history(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get user's quiz history"""
    try:
        quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).all()
        return {
            "quizzes": [{
                "id": q.id,
                "flashcard_id": q.flashcard_id,
                "language_id": q.language_id,
                "quiz_type_id": q.quiz_type_id,
                "score": q.score,
                "completed_at": q.completed_at
            } for q in quizzes]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))