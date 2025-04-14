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
from dotenv import load_dotenv

from app.database import Base, engine
from app.models.user import User
from app.models.waitlist import Waitlist
from app.models.quiz import Quiz, QuizType
from app.models.flashcard import Flashcard, UserFlashcard
from app.models.chat import ChatbotInteraction, Language
from app.models.catalog import Catalog, CatalogFlashcard
from app.models.sharing import FlashcardShare, CatalogShare
from app.models.user_settings import UserSettings
from sqlalchemy.orm import Session
from app.dependencies.auth import get_password_hash

load_dotenv()

def init_quiz_types(session: Session) -> None:
    """Initialize quiz types in the database.
    
    Args:
        session: SQLAlchemy database session
    """
    quiz_type_names = [
        'Definition Recognition',
        'Synonyms & Antonyms',
        'Fill-in-the-Blank',
        'Multiple-Choice Context',
        'True/False Judgments'
    ]
    
    for name in quiz_type_names:
        if not session.query(QuizType).filter(QuizType.name == name).first():
            session.add(QuizType(name=name))

def init_languages(session: Session) -> None:
    """Initialize supported languages in the database.
    
    Args:
        session: SQLAlchemy database session
    """
    language_data = [
        ('Spanish', 'es'),
        ('Japanese', 'ja'),
        ('French', 'fr'),
        ('German', 'de'),
        ('Chinese', 'zh'),
        ('Vietnamese', 'vi'),
        ('English', 'en')
    ]
    
    for name, code in language_data:
        if not session.query(Language).filter(Language.name == name).first():
            session.add(Language(name=name, code=code))

def create_admin_user(session: Session) -> None:
    """Create an admin user if one doesn't exist."""
    admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

    if not session.query(User).filter(User.is_admin == True).first():
        admin_user = User(
            email=admin_email,
            username="Admin",  # Optional username
            hashed_password=get_password_hash(admin_password),
            is_admin=True
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
            is_admin=False
        )
        session.add(sample_user)
        session.flush()  # To get the user ID

    if not session.query(Flashcard).filter(Flashcard.front == "Hola").first():
        sample_flashcard = Flashcard(
            front="Hola",
            back="Hello",
            language="Spanish",
            owner_id=sample_user.id  # Assign the owner_id
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
    users_without_settings = session.query(User).outerjoin(
        UserSettings, User.id == UserSettings.user_id
    ).filter(UserSettings.user_id.is_(None)).all()

    for user in users_without_settings:
        settings = UserSettings(
            user_id=user.id,
            allow_duplicates=False,
            default_visibility="private",
            preferred_languages="en",  # Default to English
            ui_preferences='{"theme": "light"}'  # Default UI preferences as JSON
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
        init_quiz_types(session)
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