import os
from typing import List, Dict, Any
import json
import asyncio
from celery import Celery
from openai import AsyncOpenAI
from app.config import get_settings
from app.globals import clients, configs
from app.schemas.openai_schemas import (
    VALIDATE_SCHEMA,
    FLASHCARD_SCHEMA,
    WORD_TYPE_SCHEMA,
    WORD_RELATIONS_SCHEMA,
    RELATED_PHRASES_SCHEMA,
    QUIZ_TYPE_SCHEMAS,
)

settings = get_settings()
configs["app_config"] = settings

# Initialize celery
celery = Celery('tasks')
celery.conf.broker_url = os.environ.get("CELERY_BROKER_URL", "redis://redis:6379")
celery.conf.result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://redis:6379")

# Initialize OpenAI client in the global clients dictionary
clients["openai"] = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

@celery.task
def validate_words_batch(words: List[str], language: str) -> List[str]:
    """Validate a batch of words using LLM."""
    async def _validate():
        response = await clients["openai"].responses.create(
            model=settings.OPENAI_MODEL,
            input=[
                {
                    "role": "system",
                    "content": "You are a word validation assistant. Filter out any invalid entries that are not words or meaningful phrases.",
                },
                {"role": "user", "content": "\n".join(words)},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "valid_words",
                    "schema": VALIDATE_SCHEMA,
                    "strict": True,
                }
            },
        )
        result = json.loads(response.output[0].content[0].text)
        return result["valid_words"]

    return asyncio.run(_validate())

@celery.task
def generate_flashcards_batch(words: List[str], language: str) -> List[Dict[str, str]]:
    """Generate flashcards for a batch of words using LLM."""
    async def _generate():
        response = await clients["openai"].responses.create(
            model=settings.OPENAI_MODEL,
            input=[
                {
                    "role": "system",
                    "content": f"You are a language translation assistant. Generate clear and accurate definitions in English for these {language} words/phrases.",
                },
                {"role": "user", "content": "\n".join(words)},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "flashcards",
                    "schema": FLASHCARD_SCHEMA,
                    "strict": True,
                }
            },
        )
        result = json.loads(response.output[0].content[0].text)
        return result["flashcards"]

    return asyncio.run(_generate())

@celery.task
def generate_quizzes_batch(flashcard: Dict[str, str], quiz_types: List[str]) -> List[Dict[str, Any]]:
    """Generate quizzes for a flashcard."""
    async def _detect_word_type(word: str, meaning: str) -> Dict:
        response = await clients["openai"].responses.create(
            model=settings.OPENAI_MODEL,
            input=[
                {
                    "role": "system",
                    "content": "You are a language analysis assistant. Determine if the given text is a single word or a phrase.",
                },
                {"role": "user", "content": f"Text: {word}\nMeaning: {meaning}"},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "word_type",
                    "schema": WORD_TYPE_SCHEMA,
                    "strict": True,
                }
            },
        )
        return json.loads(response.output[0].content[0].text)

    async def _get_word_relations(word: str, meaning: str) -> Dict:
        response = await clients["openai"].responses.create(
            model=settings.OPENAI_MODEL,
            input=[
                {
                    "role": "system",
                    "content": "You are a language assistant. Generate synonyms and antonyms for the given word.",
                },
                {"role": "user", "content": f"Word: {word}\nMeaning: {meaning}"},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "word_relations",
                    "schema": WORD_RELATIONS_SCHEMA,
                    "strict": True,
                }
            },
        )
        return json.loads(response.output[0].content[0].text)

    async def _get_related_phrases(word: str, meaning: str) -> Dict:
        response = await clients["openai"].responses.create(
            model=settings.OPENAI_MODEL,
            input=[
                {
                    "role": "system",
                    "content": "You are a language assistant. Generate phrases or proverbs that share meaning with the given word.",
                },
                {"role": "user", "content": f"Word: {word}\nMeaning: {meaning}"},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "related_phrases",
                    "schema": RELATED_PHRASES_SCHEMA,
                    "strict": True,
                }
            },
        )
        return json.loads(response.output[0].content[0].text)

    async def _generate_quiz(quiz_type: str, word: str, meaning: str, word_info: Dict = None) -> Dict:
        schema = QUIZ_TYPE_SCHEMAS[quiz_type]
        system_prompt = "You are a quiz generation assistant. Generate a quiz based on the given word and its meaning."
        
        if quiz_type in ["Synonym Selection (Multiple-Choice)", "Antonym Selection (Multiple-Choice)"]:
            if not word_info or "synonyms" not in word_info or "antonyms" not in word_info:
                return None
            additional_context = f"\nSynonyms: {', '.join(word_info['synonyms'])}\nAntonyms: {', '.join(word_info['antonyms'])}"
        elif quiz_type in ["Word to Proverb (Multiple-Choice)", "Proverb to Word (Multiple-Choice)", "Proverb to Word (Cloze)"]:
            if not word_info or "phrases" not in word_info:
                return None
            additional_context = f"\nRelated Phrases: {json.dumps(word_info['phrases'])}"
        else:
            additional_context = ""

        response = await clients["openai"].responses.create(
            model=settings.OPENAI_MODEL,
            input=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {"role": "user", "content": f"Word: {word}\nMeaning: {meaning}{additional_context}\nQuiz Type: {quiz_type}"},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "quiz",
                    "schema": schema,
                    "strict": True,
                }
            },
        )
        return json.loads(response.output[0].content[0].text)

    async def _process():
        word, meaning = flashcard["front"], flashcard["back"]
        quizzes = []

        # 1. Detect if word or phrase
        word_type_info = await _detect_word_type(word, meaning)
        
        # Initialize word_info for quiz generation
        word_info = {}
        
        # 2. If it's a word, get synonyms, antonyms and phrases
        if word_type_info["type"] == "word":
            relations = await _get_word_relations(word, meaning)
            word_info.update(relations)
            phrases = await _get_related_phrases(word, meaning)
            word_info.update(phrases)

        # 3. Generate quizzes for each type
        for quiz_type in quiz_types:
            quiz_content = await _generate_quiz(quiz_type, word, meaning, word_info)
            if quiz_content:
                quizzes.append({
                    "type": quiz_type,
                    "content": quiz_content
                })

        return quizzes

    return asyncio.run(_process())