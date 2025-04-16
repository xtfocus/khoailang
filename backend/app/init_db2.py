"""Extended database initialization script with dummy data.

This script builds on top of init_db.py to create additional test data
for development and testing purposes.

Demo Assumptions:

Users:
- Quang (email: quang@example.com) is a Vietnamese student learning English.
- Thuy (email: thuy@example.com) is a Vietnamese student learning English.
- Lan (email: lan@example.com) is a Vietnamese student learning English.

Catalogs:
- Quang owns the "Weather Vocabulary" catalog, which is public.
- Thuy owns the "Office Vocabulary" catalog, which is private.
- Lan owns the "Interview Vocabulary" catalog, which is private.

Sharing:
- The "Interview Vocabulary" catalog is shared with Thuy only, and she cannot modify it.
- The "Weather Vocabulary" catalog is shared with Thuy, with selective flashcard sharing:
  - 'sunny', 'cloud', and 'storm' flashcards are individually shared with Thuy
  - Other flashcards ('rain', 'wind', 'work') are not individually shared
- The "Office Vocabulary" catalog is shared with Quang.

Flashcards:
- All flashcards in both "Weather Vocabulary" and "Office Vocabulary" catalogs are authored by Quang.
- Flashcards in the "Weather Vocabulary" catalog include:
  - "rain" (definition: "Precipitation in the form of water droplets.")
  - "sunny" (definition: "Bright with sunlight.")
  - "cloud" (definition: "A visible mass of condensed water vapor in the sky.")
  - "storm" (definition: "A violent disturbance of the atmosphere.")
  - "wind" (definition: "The natural movement of air.")
  - "work" (definition: "Activity involving mental or physical effort done to achieve a purpose.")
- Flashcards in the "Office Vocabulary" catalog include:
  - "desk" (definition: "A piece of furniture with a flat surface for working.")
  - "computer" (definition: "An electronic device for storing and processing data.")
  - "meeting" (definition: "An assembly of people for discussion.")
  - "report" (definition: "A document that presents information in an organized format.")
  - "deadline" (definition: "The latest time by which something must be completed.")
  - "work" (definition: "Activity involving mental or physical effort done to achieve a purpose.")
"""

from app.database import engine
from app.dependencies.auth import get_password_hash
from app.init_db import init_db
from app.models.catalog import Catalog, CatalogFlashcard
from app.models.chat import Language
from app.models.flashcard import Flashcard
from app.models.quiz import QuizType
from app.models.sharing import CatalogShare, FlashcardShare
from app.models.user import User
from app.models.user_flashcard import UserFlashcard
from dotenv import load_dotenv
from sqlalchemy.orm import Session

load_dotenv()


def create_dummy_users(session: Session) -> dict:
    """Create three normal users for testing."""
    users = {}
    test_users = [
        {"email": "quang@example.com", "username": "quang", "password": "test123"},
        {"email": "thuy@example.com", "username": "thuy", "password": "test123"},
        {"email": "lan@example.com", "username": "lan", "password": "test123"},
    ]

    for user_data in test_users:
        user = session.query(User).filter(User.email == user_data["email"]).first()
        if not user:
            user = User(
                email=user_data["email"],
                username=user_data["username"],
                hashed_password=get_password_hash(user_data["password"]),
                is_admin=False,
            )
            session.add(user)
            session.flush()  # To get the user ID
        users[user_data["username"]] = user

    return users


def create_dummy_catalogs(session: Session, users: dict) -> dict:
    """Create weather, office, and interview catalogs."""
    catalogs = {}
    catalog_data = [
        {
            "name": "Weather Vocabulary",
            "description": "Common weather-related terms and expressions",
            "visibility": "public",
            "owner": users["quang"],
        },
        {
            "name": "Office Vocabulary",
            "description": "Essential office and workplace terminology",
            "visibility": "private",
            "owner": users["thuy"],
        },
        {
            "name": "Interview Vocabulary",
            "description": "Key terms for job interviews and professional settings",
            "visibility": "private",
            "owner": users["lan"],
        },
    ]

    for data in catalog_data:
        catalog = Catalog(
            name=data["name"],
            description=data["description"],
            owner_id=data["owner"].id,
            visibility=data["visibility"],
        )
        session.add(catalog)
        session.flush()
        catalogs[data["name"]] = catalog

    return catalogs


def create_dummy_flashcards(session: Session, catalogs: dict, users: dict) -> None:
    """Create flashcards for weather and office catalogs."""
    # Fetch the English language ID
    english_language = (
        session.query(Language).filter(Language.name == "English").first()
    )
    if not english_language:
        raise ValueError(
            "English language not found in the database. Please initialize languages first."
        )

    flashcard_data = {
        "Weather Vocabulary": [
            ("rain", "Precipitation in the form of water droplets."),
            ("sunny", "Bright with sunlight."),
            ("cloud", "A visible mass of condensed water vapor in the sky."),
            ("storm", "A violent disturbance of the atmosphere."),
            ("wind", "The natural movement of air."),
            (
                "work",
                "Activity involving mental or physical effort done to achieve a purpose.",
            ),  # Shared word
        ],
        "Office Vocabulary": [
            ("desk", "A piece of furniture with a flat surface for working."),
            ("computer", "An electronic device for storing and processing data."),
            ("meeting", "An assembly of people for discussion."),
            ("report", "A document that presents information in an organized format."),
            ("deadline", "The latest time by which something must be completed."),
            (
                "work",
                "Activity involving mental or physical effort done to achieve a purpose.",
            ),  # Shared word
        ],
    }
    for catalog_name, words in flashcard_data.items():
        catalog = catalogs[catalog_name]
        for front, back in words:
            # Create flashcard
            flashcard = Flashcard(
                front=front,
                back=back,
                language_id=english_language.id,  
                owner_id=users["quang"].id,  # All flashcards are authored by Quang
            )
            session.add(flashcard)
            session.flush()
            # Link flashcard to catalog
            catalog_flashcard = CatalogFlashcard(
                catalog_id=catalog.id, flashcard_id=flashcard.id
            )
            session.add(catalog_flashcard)


def create_user_flashcards(session: Session, users: dict) -> None:
    """Create user-specific flashcard progress."""
    flashcards = session.query(Flashcard).all()
    for user in users.values():
        for flashcard in flashcards:
            user_flashcard = UserFlashcard(
                user_id=user.id,
                flashcard_id=flashcard.id,
                memory_strength=0,  # Memory strength is now an integer between 0 and 100
            )
            session.add(user_flashcard)


def create_shares(session: Session, catalogs: dict, users: dict) -> None:
    """Share catalogs and flashcards."""
    # Share "Weather Vocabulary" catalog with Thuy
    weather_catalog_share = CatalogShare(
        catalog_id=catalogs["Weather Vocabulary"].id, shared_with_id=users["thuy"].id
    )
    session.add(weather_catalog_share)

    # Share "Office Vocabulary" catalog with Quang
    office_catalog_share = CatalogShare(
        catalog_id=catalogs["Office Vocabulary"].id, shared_with_id=users["quang"].id
    )
    session.add(office_catalog_share)

    # Share "Interview Vocabulary" catalog with Thuy
    interview_catalog_share = CatalogShare(
        catalog_id=catalogs["Interview Vocabulary"].id, shared_with_id=users["thuy"].id
    )
    session.add(interview_catalog_share)

    # Share specific flashcards from Weather Vocabulary with Thuy
    weather_flashcards = (
        session.query(Flashcard)
        .join(CatalogFlashcard)
        .filter(CatalogFlashcard.catalog_id == catalogs["Weather Vocabulary"].id)
        .all()
    )

    # Share 'sunny' and 'cloud' flashcards with Thuy (but not 'rain' as specified in comments)
    for flashcard in weather_flashcards:
        if flashcard.front in ["sunny", "cloud", "storm"]:
            flashcard_share = FlashcardShare(
                flashcard_id=flashcard.id, shared_with_id=users["thuy"].id
            )
            session.add(flashcard_share)


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


def init_dummy_data():
    """Initialize database with dummy data."""
    print("Running base database initialization...")
    init_db()

    print("Creating dummy data...")
    with Session(engine) as session:
        # Create users
        users = create_dummy_users(session)

        # Create catalogs owned by users
        catalogs = create_dummy_catalogs(session, users)

        # Create flashcards and link them to catalogs
        create_dummy_flashcards(session, catalogs, users)

        # Create user flashcard progress
        create_user_flashcards(session, users)

        # Share catalogs between users
        create_shares(session, catalogs, users)

        # Initialize quiz types
        create_quiz_types(session)

        session.commit()


if __name__ == "__main__":
    print("Initializing database with dummy data...")
    init_dummy_data()
    print("Database initialization with dummy data completed successfully!")
