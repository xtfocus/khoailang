from environs import Env
from functools import lru_cache

class ModelConfig:
    def __init__(self):
        env = Env()
        env.read_env()
        
        # OpenAI Configuration
        self.OPENAI_API_KEY = env.str("OPENAI_API_KEY")
        self.OPENAI_MODEL = env.str("OPENAI_MODEL", "gpt-4o-mini")  # Default to gpt-4o-mini
        self.OPENAI_CONCURRENT_REQUESTS = env.int("OPENAI_CONCURRENT_REQUESTS", 5)  # Default to 5 concurrent requests

@lru_cache()
def get_settings() -> ModelConfig:
    return ModelConfig()