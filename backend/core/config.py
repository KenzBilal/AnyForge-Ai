import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GROQ_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    WEBHOOK_SECRET: str = ""
    ADMIN_API_KEY: str = ""

    class Config:
        case_sensitive = True

# We try to load from .env if it exists, but usually environment variables are injected.
# If they are missing, Pydantic will raise a helpful ValidationError.
try:
    settings = Settings()
except Exception as e:
    # Fallback to raising the same runtime error as the original main.py for backward compatibility
    _REQUIRED = ["GROQ_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    _missing = [v for v in _REQUIRED if not os.getenv(v)]
    if _missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(_missing)}")
    else:
        raise e
