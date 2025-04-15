from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.catalog import Catalog
from app.dependencies.auth import get_current_user

router = APIRouter()

@router.get("/owned")
async def get_owned_catalogs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    catalogs = db.query(Catalog)\
        .filter(Catalog.owner_id == current_user.id)\
        .all()
    
    return catalogs