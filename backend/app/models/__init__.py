from app.database import Base

# Import all models here
from app.models.user import User
from app.models.flashcard import Flashcard
from app.models.user_flashcard import UserFlashcard
from app.models.quiz import Quiz, QuizType
from app.models.chat import ChatbotInteraction, Language
from app.models.catalog import Catalog, CatalogFlashcard
from app.models.sharing import CatalogShare, FlashcardShare
from app.models.user_settings import UserSettings
from app.models.waitlist import Waitlist

# This ensures all models are registered with SQLAlchemy
__all__ = [
    'User',
    'Flashcard',
    'UserFlashcard',
    'Quiz',
    'QuizType',
    'ChatbotInteraction',
    'Language',
    'Catalog',
    'CatalogFlashcard',
    'CatalogShare',
    'FlashcardShare',
    'UserSettings',
    'Waitlist'
]