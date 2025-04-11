from fastapi import FastAPI
from app.routes.auth import router as auth_router

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to the backend API!"}

# Include the authentication routes
app.include_router(auth_router, prefix="/auth", tags=["auth"])