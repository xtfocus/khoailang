from sqlalchemy.orm import Session
from app.database import engine
from app.models.user import User
from app.models.catalog import Catalog, CatalogFlashcard
from app.models.sharing import CatalogShare, FlashcardShare
from app.models.flashcard import Flashcard
from app.init_db2 import init_dummy_data

def test_init_db2():
    """Test the assumptions implemented in init_db2.py."""
    with Session(engine) as session:
        # Run the initialization script
        init_dummy_data()

        # Test 1: Quang owns the Weather catalog
        weather_catalog = session.query(Catalog).filter(Catalog.name == "Weather Vocabulary").first()
        quang = session.query(User).filter(User.email == "quang@example.com").first()
        if weather_catalog and weather_catalog.owner_id == quang.id:
            print('test "Quang owns Weather catalog": OK')
        else:
            print('test "Quang owns Weather catalog": FAIL')

        # Test 2: Thuy owns the Office catalog
        office_catalog = session.query(Catalog).filter(Catalog.name == "Office Vocabulary").first()
        thuy = session.query(User).filter(User.email == "thuy@example.com").first()
        if office_catalog and office_catalog.owner_id == thuy.id:
            print('test "Thuy owns Office catalog": OK')
        else:
            print('test "Thuy owns Office catalog": FAIL')

        # Test 3: Lan owns the Interview catalog
        interview_catalog = session.query(Catalog).filter(Catalog.name == "Interview Vocabulary").first()
        lan = session.query(User).filter(User.email == "lan@example.com").first()
        if interview_catalog and interview_catalog.owner_id == lan.id:
            print('test "Lan owns Interview catalog": OK')
        else:
            print('test "Lan owns Interview catalog": FAIL')

        # Test 4: Interview catalog is shared with Thuy only
        interview_shares = session.query(CatalogShare).filter(CatalogShare.catalog_id == interview_catalog.id).all()
        if len(interview_shares) == 1 and interview_shares[0].shared_with_id == thuy.id:
            print('test "Interview catalog is shared with Thuy only": OK')
        else:
            print('test "Interview catalog is shared with Thuy only": FAIL')

        # Test 5: Flashcards in Weather catalog are authored by Quang
        weather_flashcards = (
            session.query(Flashcard)
            .join(CatalogFlashcard, CatalogFlashcard.flashcard_id == Flashcard.id)
            .join(Catalog, Catalog.id == CatalogFlashcard.catalog_id)
            .filter(Catalog.name == "Weather Vocabulary")
            .all()
        )
        if all(flashcard.owner_id == quang.id for flashcard in weather_flashcards):
            print('test "Flashcards in Weather catalog are authored by Quang": OK')
        else:
            print('test "Flashcards in Weather catalog are authored by Quang": FAIL')

        # Test 6: "rain" flashcard is not shared with Thuy
        rain_flashcard = session.query(Flashcard).filter(Flashcard.front == "rain").first()
        rain_share = session.query(FlashcardShare).filter(
            FlashcardShare.flashcard_id == rain_flashcard.id,
            FlashcardShare.shared_with_id == thuy.id
        ).first()
        if rain_share is None:
            print('test "rain flashcard is not shared with Thuy": OK')
        else:
            print('test "rain flashcard is not shared with Thuy": FAIL')

if __name__ == "__main__":
    test_init_db2()