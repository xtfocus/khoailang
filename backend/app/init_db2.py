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
- The "Weather Vocabulary" catalog is shared with Thuy, but the "rain" flashcard within it is not shared.

Flashcards:
- All flashcards in the "Weather Vocabulary" catalog are authored by Quang.
- All flashcards in the "Office Vocabulary" catalog are authored by Quang.
- Flashcards in the "Weather Vocabulary" catalog include terms like "rain" (definition: "Precipitation in the form of water droplets.") and "sunny" (definition: "Bright with sunlight.").
- Flashcards in the "Office Vocabulary" catalog include terms like "desk" (definition: "A piece of furniture with a flat surface for working.") and "computer" (definition: "An electronic device for storing and processing data.").
"""

from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.database import engine
from app.dependencies.auth import get_password_hash
from app.models.user import User
from app.models.catalog import Catalog, CatalogFlashcard
from app.models.flashcard import Flashcard, UserFlashcard
from app.models.sharing import CatalogShare, FlashcardShare
from app.models.chat import Language
from app.init_db import init_db

load_dotenv()

def create_dummy_users(session: Session) -> dict:
    """Create three normal users for testing."""
    users = {}
    test_users = [
        {
            "email": "quang@example.com",
            "username": "quang",
            "password": "test123"
        },
        {
            "email": "thuy@example.com",
            "username": "thuy",
            "password": "test123"
        },
        {
            "email": "lan@example.com",
            "username": "lan",
            "password": "test123"
        }
    ]

    for user_data in test_users:
        user = session.query(User).filter(User.email == user_data["email"]).first()
        if not user:
            user = User(
                email=user_data["email"],
                username=user_data["username"],
                hashed_password=get_password_hash(user_data["password"]),
                is_admin=False
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
            "owner": users["quang"]
        },
        {
            "name": "Office Vocabulary",
            "description": "Essential office and workplace terminology",
            "visibility": "private",
            "owner": users["thuy"]
        },
        {
            "name": "Interview Vocabulary",
            "description": "Key terms for job interviews and professional settings",
            "visibility": "private",
            "owner": users["lan"]
        }
    ]

    for data in catalog_data:
        catalog = Catalog(
            name=data["name"],
            description=data["description"],
            owner_id=data["owner"].id,
            visibility=data["visibility"]
        )
        session.add(catalog)
        session.flush()
        catalogs[data["name"]] = catalog

    return catalogs

def create_dummy_flashcards(session: Session, catalogs: dict, users: dict) -> None:
    """Create flashcards for weather and office catalogs."""
    # Fetch the language_id for English
    english_language = session.query(Language).filter(Language.code == "en").first()
    if not english_language:
        raise ValueError("English language not found in the database. Please initialize languages first.")

    flashcard_data = {
        "Weather Vocabulary": [
            ("rain", "Precipitation in the form of water droplets."),
            ("sunny", "Bright with sunlight."),
            ("cloud", "A visible mass of condensed water vapor in the sky."),
            ("storm", "A violent disturbance of the atmosphere."),
            ("wind", "The natural movement of air."),
            ("work", "Activity involving mental or physical effort done to achieve a purpose.")  # Shared word
        ],
        "Office Vocabulary": [
            ("desk", "A piece of furniture with a flat surface for working."),
            ("computer", "An electronic device for storing and processing data."),
            ("meeting", "An assembly of people for discussion."),
            ("report", "A document that presents information in an organized format."),
            ("deadline", "The latest time by which something must be completed."),
            ("work", "Activity involving mental or physical effort done to achieve a purpose.")  # Shared word
        ]
    }
    for catalog_name, words in flashcard_data.items():
        catalog = catalogs[catalog_name]
        for front, back in words:
            # Create flashcard
            flashcard = Flashcard(
                front=front,
                back=back,
                language=english_language.code,  # Use language code instead of ID
                owner_id=users["quang"].id  # All flashcards are authored by Quang
            )
            session.add(flashcard)
            session.flush()
            # Link flashcard to catalog
            catalog_flashcard = CatalogFlashcard(
                catalog_id=catalog.id,
                flashcard_id=flashcard.id
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
                memory_strength=0  # Memory strength is now an integer between 0 and 100
            )
            session.add(user_flashcard)

def create_shares(session: Session, catalogs: dict, users: dict) -> None:
    """Share catalogs and flashcards."""
    # Share "Weather Vocabulary" catalog with Thuy
    weather_catalog_share = CatalogShare(
        catalog_id=catalogs["Weather Vocabulary"].id,
        shared_with_id=users["thuy"].id
    )
    session.add(weather_catalog_share)
    # Share "Office Vocabulary" catalog with Quang
    office_catalog_share = CatalogShare(
        catalog_id=catalogs["Office Vocabulary"].id,
        shared_with_id=users["quang"].id
    )
    session.add(office_catalog_share)
    # Share "Interview Vocabulary" catalog with Thuy
    interview_catalog_share = CatalogShare(
        catalog_id=catalogs["Interview Vocabulary"].id,
        shared_with_id=users["thuy"].id
    )
    session.add(interview_catalog_share)
    # Special case: Share "Weather Vocabulary" catalog but exclude a specific flashcard
    excluded_flashcard = session.query(Flashcard).filter(Flashcard.front == "rain").first()
    if excluded_flashcard:
        # Do not share this specific flashcard with Thuy
        pass

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
        
        session.commit()

if __name__ == "__main__":
    print("Initializing database with dummy data...")
    init_dummy_data()
    print("Database initialization with dummy data completed successfully!")
