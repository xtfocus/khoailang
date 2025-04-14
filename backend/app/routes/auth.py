from fastapi import APIRouter, Depends, HTTPException, status, FastAPI, Form
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token, WaitlistSchema
from app.dependencies.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_optional
)
from app.models.waitlist import Waitlist
from pydantic import BaseModel

router = APIRouter()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)):
    # Check if email exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,  # Username is optional
        hashed_password=hashed_password,
        is_admin=user.is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == username).first()  # Use 'username' field to pass email
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/me/is_admin")
def check_admin_status(current_user: User = Depends(get_current_user)) -> bool:
    return current_user.is_admin

@router.get("/users", response_model=list[UserResponse])
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can list all users"
        )
    return db.query(User).all()

@router.delete("/users/{user_id}")
def remove_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can remove users"
        )

    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own account"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Perform soft delete
    user.is_active = False
    user.deleted_at = func.now()
    db.commit()

    return {"message": "User deactivated successfully"}

class WaitlistEntry(BaseModel):
    name: str
    email: str
    password: str
    reason: str | None = None

@router.post("/waitlist", status_code=status.HTTP_201_CREATED)
def submit_waitlist_entry(
    entry: WaitlistEntry,  # Parse JSON body into this model
    db: Session = Depends(get_db)
):
    """Allow users to submit a waitlist entry."""
    if db.query(Waitlist).filter(Waitlist.email == entry.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already on the waitlist."
        )
    hashed_password = get_password_hash(entry.password)
    waitlist_entry = Waitlist(name=entry.name, email=entry.email, reason=entry.reason, password=hashed_password)
    db.add(waitlist_entry)
    db.commit()
    db.refresh(waitlist_entry)
    return {"message": "Waitlist entry submitted successfully."}

@router.get("/waitlist", response_model=list[WaitlistSchema], dependencies=[Depends(get_current_user)])
def get_waitlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Allow admins to fetch the waitlist."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access the waitlist."
        )
    return db.query(Waitlist).all()

@router.post("/waitlist/{entry_id}/approve")
def approve_waitlist_entry(entry_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Allow admins to approve a waitlist entry."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can approve waitlist entries."
        )

    entry = db.query(Waitlist).filter(Waitlist.id == entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found."
        )

    if entry.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Waitlist entry already approved."
        )

    # Create user in the users table
    db_user = User(
        email=entry.email,
        username=entry.name,  # Using name as username for simplicity
        hashed_password=entry.password,
        is_admin=False
    )
    db.add(db_user)

    # Mark waitlist entry as approved
    entry.approved = True
    db.commit()
    return {"message": "Waitlist entry approved and user created."}

@router.get("/waitlist/status/{email}")
def get_waitlist_status(email: str, db: Session = Depends(get_db)):
    """Public endpoint to check the status of a waitlist entry by email."""
    entry = db.query(Waitlist).filter(Waitlist.email == email).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found."
        )
    return {"email": entry.email, "approved": entry.approved}

@router.delete("/waitlist/{entry_id}")
def delete_waitlist_entry(entry_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Allow admins to delete a waitlist entry."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete waitlist entries."
        )

    entry = db.query(Waitlist).filter(Waitlist.id == entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waitlist entry not found."
        )

    db.delete(entry)
    db.commit()
    return {"message": "Waitlist entry deleted successfully."}

app = FastAPI()

@app.exception_handler(RequestValidationError)
def validation_exception_handler(request, exc):
    content={"detail": exc.errors(), "body": exc.body}
    print(content)
    return JSONResponse(
        status_code=422,
        content=content,
    )

# Include the router
app.include_router(router)