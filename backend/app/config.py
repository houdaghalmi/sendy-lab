from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OPENROUTER_API_KEY: str
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "openrouter/free"
    TAVILY_API_KEY: str
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/sandy-db"
    SECRET_KEY: str = "sandy123"
    
    class Config:
        env_file = ".env"

settings = Settings()