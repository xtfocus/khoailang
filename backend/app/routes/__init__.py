from fastapi import APIRouter
from .auth import router as auth_router
from .words import router as words_router
from .catalogs import router as catalogs_router
from .quizzes import router as quizzes_router

api_router = APIRouter()

# Include all routers with their prefixes
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(words_router, prefix="/api/words", tags=["words"])
api_router.include_router(catalogs_router, prefix="/api/catalogs", tags=["catalogs"])
api_router.include_router(quizzes_router, prefix="/api/quizzes", tags=["quizzes"])