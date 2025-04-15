"""Database initialization script.

This module handles the initialization of the database schema and populates
initial reference data required for the application to function. It follows
a modular approach where each type of initialization is handled by a separate
function for better maintainability.

Usage:
    python app/init_db.py

The script will:
1. Create all database tables based on SQLAlchemy models
2. Initialize reference data (quiz types, languages)
3. Add sample data if specified
"""

import os

from app.database import Base, engine
from app.dependencies.auth import get_password_hash
from app.models.catalog import Catalog, CatalogFlashcard
from app.models.chat import ChatbotInteraction, Language
from app.models.flashcard import Flashcard
from app.models.quiz import Quiz, QuizType
from app.models.sharing import CatalogShare, FlashcardShare
from app.models.user import User
from app.models.user_flashcard import UserFlashcard
from app.models.user_settings import UserSettings
from app.models.waitlist import Waitlist
from dotenv import load_dotenv
from sqlalchemy.orm import Session

load_dotenv()


def create_quiz_types(session: Session) -> None:
    """Initialize quiz types with difficulty levels."""
    quiz_types = [
        {"name": "Definition-to-Word (Multiple-Choice)", "difficulty": 1},
        {"name": "Word-to-Definition (Multiple-Choice)", "difficulty": 1},
        {"name": "Synonym Selection (Multiple-Choice)", "difficulty": 2},
        {"name": "Antonym Selection (Multiple-Choice)", "difficulty": 2},
        {"name": "Open-Ended Cloze (Cloze)", "difficulty": 5},
        {"name": "Multiple-Choice Cloze (Multiple-Choice)", "difficulty": 3},
        {"name": "Scenario Identification (Multiple-Choice)", "difficulty": 3},
        {"name": "Word to Proverb (Multiple-Choice)", "difficulty": 4},
        {"name": "Proverb to Word (Multiple-Choice)", "difficulty": 4},
        {"name": "Proverb to Word (Cloze)", "difficulty": 5},
        {"name": "Meaning Validation (True/False)", "difficulty": 1},
        {"name": "Usage Validation (True/False)", "difficulty": 2},
    ]

    for quiz_type in quiz_types:
        if (
            not session.query(QuizType)
            .filter(QuizType.name == quiz_type["name"])
            .first()
        ):
            session.add(
                QuizType(name=quiz_type["name"], difficulty=quiz_type["difficulty"])
            )


def init_languages(session: Session) -> None:
    """Initialize supported languages in the database.

    Args:
        session: SQLAlchemy database session
    """
    languages = [
        {"name": "Spanish"},
        {"name": "Japanese"},
        {"name": "French"},
        {"name": "German"},
        {"name": "Chinese"},
        {"name": "Vietnamese"},
        {"name": "English"},
    ]

    for lang in languages:
        if not session.query(Language).filter(Language.name == lang["name"]).first():
            session.add(Language(name=lang["name"]))


def create_admin_user(session: Session) -> None:
    """Create an admin user if one doesn't exist."""
    admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

    if not session.query(User).filter(User.is_admin == True).first():
        admin_user = User(
            email=admin_email,
            username="Admin",  # Optional username
            hashed_password=get_password_hash(admin_password),
            is_admin=True,
        )
        session.add(admin_user)


def add_sample_data(session: Session) -> None:
    """Add sample data for development and testing purposes.

    Args:
        session: SQLAlchemy database session
    """
    # Create a sample user to own the flashcard if not already present
    sample_user_email = "quang@example.com"
    sample_user = session.query(User).filter(User.email == sample_user_email).first()
    if not sample_user:
        sample_user = User(
            email=sample_user_email,
            username="quang",
            hashed_password=get_password_hash("test123"),
            is_admin=False,
        )
        session.add(sample_user)
        session.flush()  # To get the user ID

    # Get Spanish language ID
    spanish_language = (
        session.query(Language).filter(Language.name == "Spanish").first()
    )
    if (
        spanish_language
        and not session.query(Flashcard).filter(Flashcard.front == "Hola").first()
    ):
        sample_flashcard = Flashcard(
            front="Hola",
            back="Hello",
            language_id=spanish_language.id,
            owner_id=sample_user.id,
        )
        session.add(sample_flashcard)


def init_waitlist_table(session: Session) -> None:
    """Ensure the waitlist table is initialized."""
    pass


def init_user_settings(session: Session) -> None:
    """Initialize default user settings for existing users.

    Args:
        session: SQLAlchemy database session
    """
    users_without_settings = (
        session.query(User)
        .outerjoin(UserSettings, User.id == UserSettings.user_id)
        .filter(UserSettings.user_id.is_(None))
        .all()
    )

    for user in users_without_settings:
        settings = UserSettings(
            user_id=user.id,
            allow_duplicates=False,
            default_visibility="private",
            preferred_languages="en",  # Default to English
            ui_preferences='{"theme": "light"}',  # Default UI preferences as JSON
        )
        session.add(settings)


def init_db() -> None:
    """Main initialization function that creates tables and populates initial data.

    This function will:
    1. Create all database tables
    2. Initialize reference data (quiz types, languages)
    3. Add sample data for development
    """
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        create_quiz_types(session)
        init_languages(session)
        create_admin_user(session)
        init_waitlist_table(session)
        init_user_settings(session)
        add_sample_data(session)
        session.commit()


if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization completed successfully!")
