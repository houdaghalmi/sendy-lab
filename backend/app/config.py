from pydantic_settings import BaseSettings
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parents[1] / ".env"

class Settings(BaseSettings):
    OPENROUTER_API_KEY: str
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "openrouter/free"
    TAVILY_API_KEY: str
    DATABASE_URL: str = "postgresql://sandy:sandy123@localhost:5433/sandy_lab"
    SECRET_KEY: str = "sandy123"
    
    class Config:
        env_file = str(ENV_FILE)

settings = Settings()