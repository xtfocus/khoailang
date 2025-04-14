from fastapi import FastAPI
from app.routes.auth import router as auth_router
from app.api.import_words import router as import_words_router
from app.api.catalog import router as catalog_router

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to the backend API!"}

# Register the import words router
app.include_router(import_words_router, prefix="/api/words", tags=["words"])

# Include the authentication routes
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# Include the catalog routes
app.include_router(catalog_router, prefix="/api/catalogs", tags=["catalogs"])