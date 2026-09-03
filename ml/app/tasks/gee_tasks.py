from app.tasks.celery_app import celery_app
from app.gee.features import GEEFeatureProvider
from app.db.supabase import get_supabase_client
import logging

logger = logging.getLogger(__name__)

# Custom exception for sanitized errors
class GEEAsyncError(Exception):
    pass

@celery_app.task(name="acquire_gee_features", max_retries=0)
def acquire_gee_features(grid_code: str):
    logger.info(f"Starting async GEE feature acquisition for {grid_code}")
    try:
        db = get_supabase_client()
        provider = GEEFeatureProvider()
        acquired = provider.acquire(grid_code, db)
        
        # Format the result to exactly match the JSON-serializable requirement
        lineage = acquired.lineage.copy()
        rainfall_source = lineage.get("sources", {}).get("rainfall", {})
        lc_source = lineage.get("sources", {}).get("land_cover", {})
        
        return {
            "grid_code": grid_code,
            "terrain": {
                "elevation_m": acquired.features.get("elevation"),
                "slope_degrees": acquired.features.get("slope"),
                "aspect_degrees": acquired.features.get("aspect")
            },
            "rainfall": {
                "rainfall_24h_mm": acquired.features.get("rainfall_24h"),
                "rainfall_72h_mm": acquired.features.get("rainfall_72h"),
                "rainfall_7d_mm": acquired.features.get("rainfall_7d"),
                "dataset_id": rainfall_source.get("dataset"),
                "latest_observation_date": rainfall_source.get("latest_observation_date")
            },
            "land_cover": {
                "dataset_id": lc_source.get("dataset"),
                "dominant_class": acquired.features.get("land_cover"),
                "dominant_class_id": lc_source.get("dominant_class_id"),
                "observation_count": lc_source.get("observation_count"),
                "temporal_start": lc_source.get("temporal_start"),
                "temporal_end": lc_source.get("temporal_end")
            },
            "susceptibility": {
                "status": acquired.susceptibility.status,
                "source": acquired.susceptibility.source
            },
            "complete_for_model": acquired.complete_for_model,
            "is_test_data": acquired.is_test_data,
            "lineage": lineage
        }
    except Exception as e:
        # Sanitize exception: don't leak full stack traces or credentials
        error_msg = f"Feature acquisition failed for {grid_code}: {str(e)}"
        logger.error(error_msg)
        # Re-raise as a safe custom exception string so Celery stores a safe failure reason
        raise GEEAsyncError(f"GEE Acquisition Error: {str(e)}")
