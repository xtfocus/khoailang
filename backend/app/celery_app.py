from celery import Celery
from celery.signals import worker_init
from celery.utils.log import get_task_logger
from celery.exceptions import MaxRetriesExceededError
from app.config import ModelConfig
from app.globals import configs, clients
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
import asyncio
import json
from openai import AsyncOpenAI
import httpx

# Initialize Celery
celery_app = Celery(
    'cerego',
    broker='redis://redis:6379/0',
    backend='redis://redis:6379/0'
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    broker_connection_retry_on_startup=True
)

# Get Celery task logger
logger = get_task_logger(__name__)

@worker_init.connect
def init_worker(**kwargs):
    """Initialize worker with required configurations and clients"""
    # Load app config
    configs["app_config"] = ModelConfig()
    
    # Initialize OpenAI client with timeout
    clients["openai"] = AsyncOpenAI(
        api_key=configs["app_config"].OPENAI_API_KEY,
        timeout=60.0  # 60 seconds timeout
    )

@retry(
    stop=stop_after_attempt(5),  # Increased from 3 to 5 attempts
    wait=wait_exponential(multiplier=1, min=4, max=30),  # Increased max wait time
    retry=(
        retry_if_exception_type(httpx.ConnectError) |
        retry_if_exception_type(httpx.ReadTimeout) |
        retry_if_exception_type(httpx.WriteTimeout) |
        retry_if_exception_type(asyncio.TimeoutError)
    )
)
async def _call_openai_with_retry(model: str, input_data: list, text_format: dict):
    """Helper function to call OpenAI API with retry logic"""
    try:
        return await clients["openai"].responses.create(
            model=model,
            input=input_data,
            text=text_format
        )
    except (httpx.ConnectError, httpx.ReadTimeout, httpx.WriteTimeout) as e:
        logger.error(f"OpenAI API connection error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"OpenAI API call failed: {str(e)}")
        raise

def run_async(coro):
    """Helper function to run async code in sync context"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@celery_app.task(
    name="validate_words_batch",
    bind=True,
    max_retries=3,
    default_retry_delay=5 * 60  # 5 minutes between retries
)
def validate_words_batch(self, batch: list[str], language_name: str) -> list[str]:
    """Celery task to validate a batch of words"""
    try:
        response = run_async(_call_openai_with_retry(
            model=configs["app_config"].OPENAI_MODEL,
            input_data=[
                {
                    "role": "system",
                    "content": f"You are a helpful assistant that validates {language_name} words and phrases. Return only valid {language_name} words or phrases, filtering out any non-{language_name} text.",
                },
                {"role": "user", "content": "\n".join(batch)},
            ],
            text_format={
                "format": {
                    "type": "json_schema",
                    "name": "validation_result",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "valid_words": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["valid_words"],
                        "additionalProperties": False,
                    },
                    "strict": True,
                }
            }
        ))
        result = json.loads(response.output[0].content[0].text)
        return result.get("valid_words", [])
    except (httpx.ConnectError, httpx.ReadTimeout, httpx.WriteTimeout) as e:
        logger.error(f"Connection error in validate_words_batch: {str(e)}")
        try:
            self.retry(exc=e)
        except MaxRetriesExceededError:
            logger.error("Max retries exceeded for validate_words_batch")
            return []
    except Exception as e:
        logger.error(f"Error validating words: {str(e)}")
        return []

@celery_app.task(
    name="generate_flashcards_batch",
    bind=True,
    max_retries=3,
    default_retry_delay=5 * 60  # 5 minutes between retries
)
def generate_flashcards_batch(self, batch: list[str], language_name: str) -> list[dict]:
    """Celery task to generate flashcards for a batch of words"""
    try:
        response = run_async(_call_openai_with_retry(
            model=configs["app_config"].OPENAI_MODEL,
            input_data=[
                {
                    "role": "system",
                    "content": f"Generate concise definitions in English for the following {language_name} words or phrases. Return as a JSON array of objects with 'front' (word) and 'back' (definition) properties.",
                },
                {"role": "user", "content": "\n".join(batch)},
            ],
            text_format={
                "format": {
                    "type": "json_schema",
                    "name": "flashcards",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "flashcards": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "front": {"type": "string"},
                                        "back": {"type": "string"}
                                    },
                                    "required": ["front", "back"],
                                    "additionalProperties": False,
                                },
                            }
                        },
                        "required": ["flashcards"],
                        "additionalProperties": False,
                    },
                    "strict": True,
                }
            }
        ))
        result = json.loads(response.output[0].content[0].text)
        return result.get("flashcards", [])
    except (httpx.ConnectError, httpx.ReadTimeout, httpx.WriteTimeout) as e:
        logger.error(f"Connection error in generate_flashcards_batch: {str(e)}")
        try:
            self.retry(exc=e)
        except MaxRetriesExceededError:
            logger.error("Max retries exceeded for generate_flashcards_batch")
            return []
    except Exception as e:
        logger.error(f"Error generating flashcards: {str(e)}")
        return []