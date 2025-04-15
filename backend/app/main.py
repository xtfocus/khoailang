"""
File        : main.py
Description : FastAPI application entry point
"""

import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI

from app.routes import api_router, auth, words, quizzes, flashcards
from app.config import ModelConfig
from app.globals import clients, configs


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Standard FastAPI lifespan definition
    """
    # Initialize configurations
    configs["app_config"] = ModelConfig()
    app_config = configs["app_config"]

    # Initialize OpenAI client
    clients["openai"] = AsyncOpenAI(api_key=app_config.OPENAI_API_KEY)

    yield

    # Cleanup clients
    if "openai" in clients:
        await clients["openai"].close()


app = FastAPI(lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the centralized router
app.include_router(api_router)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(words.router, prefix="/api/words", tags=["words"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["quizzes"])
app.include_router(flashcards.router, prefix="/api/flashcards", tags=["flashcards"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Cerego API"}