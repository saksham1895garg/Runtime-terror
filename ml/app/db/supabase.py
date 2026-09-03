import os
from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    # Use config values, fallback to dummy to avoid breaking local dev if env not set
    url = settings.SUPABASE_URL or os.environ.get("SUPABASE_URL", "http://localhost:8000")
    key = settings.SUPABASE_KEY or os.environ.get("SUPABASE_KEY", "dummy-key")
    return create_client(url, key)
