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

        # Get users
        quang = session.query(User).filter(User.email == "quang@example.com").first()
        thuy = session.query(User).filter(User.email == "thuy@example.com").first()
        lan = session.query(User).filter(User.email == "lan@example.com").first()

        # Test 1: Basic catalog ownership
        weather_catalog = session.query(Catalog).filter(Catalog.name == "Weather Vocabulary").first()
        office_catalog = session.query(Catalog).filter(Catalog.name == "Office Vocabulary").first()
        interview_catalog = session.query(Catalog).filter(Catalog.name == "Interview Vocabulary").first()

        if weather_catalog and weather_catalog.owner_id == quang.id:
            print('test "Quang owns Weather catalog": OK')
        else:
            print('test "Quang owns Weather catalog": FAIL')

        if office_catalog and office_catalog.owner_id == thuy.id:
            print('test "Thuy owns Office catalog": OK')
        else:
            print('test "Thuy owns Office catalog": FAIL')

        if interview_catalog and interview_catalog.owner_id == lan.id:
            print('test "Lan owns Interview catalog": OK')
        else:
            print('test "Lan owns Interview catalog": FAIL')

        # Test 2: Catalog sharing
        weather_shares = session.query(CatalogShare).filter(CatalogShare.catalog_id == weather_catalog.id).all()
        if any(share.shared_with_id == thuy.id for share in weather_shares):
            print('test "Weather catalog is shared with Thuy": OK')
        else:
            print('test "Weather catalog is shared with Thuy": FAIL')

        office_shares = session.query(CatalogShare).filter(CatalogShare.catalog_id == office_catalog.id).all()
        if any(share.shared_with_id == quang.id for share in office_shares):
            print('test "Office catalog is shared with Quang": OK')
        else:
            print('test "Office catalog is shared with Quang": FAIL')

        interview_shares = session.query(CatalogShare).filter(CatalogShare.catalog_id == interview_catalog.id).all()
        if len(interview_shares) == 1 and interview_shares[0].shared_with_id == thuy.id:
            print('test "Interview catalog is shared with Thuy only": OK')
        else:
            print('test "Interview catalog is shared with Thuy only": FAIL')

        # Test 3: Flashcard ownership (all by Quang as per implementation)
        all_flashcards = session.query(Flashcard).all()
        if all(flashcard.owner_id == quang.id for flashcard in all_flashcards):
            print('test "All flashcards are authored by Quang": OK')
        else:
            print('test "All flashcards are authored by Quang": FAIL')

        # Test 4: Individual flashcard sharing
        # These should be shared with Thuy
        shared_words = ['sunny', 'cloud', 'storm']
        for word in shared_words:
            flashcard = session.query(Flashcard).filter(Flashcard.front == word).first()
            if flashcard:
                share = session.query(FlashcardShare).filter(
                    FlashcardShare.flashcard_id == flashcard.id,
                    FlashcardShare.shared_with_id == thuy.id
                ).first()
                if share:
                    print(f'test "{word} flashcard is shared with Thuy": OK')
                else:
                    print(f'test "{word} flashcard is shared with Thuy": FAIL')
            else:
                print(f'test "{word} flashcard exists": FAIL')

        # These should NOT be shared with Thuy
        unshared_words = ['rain', 'wind', 'work']
        for word in unshared_words:
            flashcard = session.query(Flashcard).filter(Flashcard.front == word).first()
            if flashcard:
                share = session.query(FlashcardShare).filter(
                    FlashcardShare.flashcard_id == flashcard.id,
                    FlashcardShare.shared_with_id == thuy.id
                ).first()
                if share is None:
                    print(f'test "{word} flashcard is NOT shared with Thuy": OK')
                else:
                    print(f'test "{word} flashcard is NOT shared with Thuy": FAIL')
            else:
                print(f'test "{word} flashcard exists": FAIL')

if __name__ == "__main__":
    test_init_db2()