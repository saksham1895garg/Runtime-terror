from fastapi import APIRouter, Depends
from supabase import Client
from app.db.supabase import get_supabase_client
from app.tasks.celery_app import celery_app
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
def health_check(db: Client = Depends(get_supabase_client)):
    # DB Check
    db_status = "unreachable"
    try:
        res = db.table("analysis_grid_cells").select("grid_code").limit(1).execute()
        db_status = "connected"
    except Exception as e:
        logger.error(f"DB Health check failed: {e}")
        # If it's an APIError, it means we reached Supabase but the query failed (e.g. schema error)
        if "APIError" in str(type(e)):
            db_status = "error"
        else:
            db_status = "unreachable"

    # Redis/Celery check
    redis_ok = False
    try:
        # Check celery broker connection
        with celery_app.connection() as conn:
            conn.ensure_connection(max_retries=1)
        redis_ok = True
    except Exception as e:
        logger.error(f"Redis Health check failed: {e}")

    return {
        "status": "ok" if (db_status == "connected" and redis_ok) else "degraded",
        "service": "dhara-soochak-ml",
        "phase": 8,
        "database": db_status,
        "redis_queue": "connected" if redis_ok else "unreachable"
    }
