from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal, Optional

class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    ENVIRONMENT: str = "development"
    REDIS_URL: str = ""
    
    MODEL_BACKEND: Literal["TEST", "PRODUCTION"] = "TEST"
    MODEL_PATH: Optional[str] = None
    MODEL_NAME: str = "REAL_PREDICTOR"
    MODEL_VERSION: str = "v1"

    FEATURE_BACKEND: Literal["TEST", "GEE"] = "TEST"
    GEE_ENABLED: bool = False
    GEE_PROJECT: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
