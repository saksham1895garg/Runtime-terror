from app.tasks.celery_app import celery_app
from app.db.supabase import get_supabase_client
from app.features.test_generator import TestFeatureGenerator
from app.model.predictor import TestPredictor
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PredictionAsyncError(Exception):
    pass

@celery_app.task(name="run_grid_prediction", max_retries=0)
def run_grid_prediction(run_id: str, grid_code: str):
    logger.info(f"Starting async TEST prediction for {grid_code} in run {run_id}")
    db = get_supabase_client()
    
    try:
        # Duplicate protection check
        existing = db.table("risk_predictions").select("id").eq("run_id", run_id).eq("grid_code", grid_code).execute()
        if existing.data:
            logger.warning(f"Duplicate task detected for grid {grid_code} in run {run_id}. Skipping.")
            return {"status": "FAILED", "grid_code": grid_code, "error": "Duplicate prediction task"}

        db.table("prediction_job_events").insert({
            "run_id": run_id,
            "event_type": "TASK_STARTED",
            "message": f"Test prediction job started for {grid_code}",
            "processed_cells": 0,
            "total_cells": 1
        }).execute()

        generator = TestFeatureGenerator()
        acquired_features = generator.acquire(grid_code, db)
        features = acquired_features.to_grid_features()

        predictor = TestPredictor()
        prediction = predictor.predict(features)
        
        input_snapshot = features.model_dump()
        input_snapshot["is_test_data"] = True

        db.table("risk_predictions").insert({
            "run_id": run_id,
            "grid_code": grid_code,
            "risk_score": prediction.risk_score,
            "risk_category": prediction.risk_category,
            "confidence": prediction.confidence,
            "model_name": "TEST_PREDICTOR",
            "model_version": "TEST-v1",
            "input_snapshot": input_snapshot,
            "explanation": prediction.explanation
        }).execute()
        
        db.table("prediction_job_events").insert({
            "run_id": run_id,
            "event_type": "TASK_COMPLETED",
            "message": f"Test prediction completed successfully for {grid_code}",
            "processed_cells": 1,
            "total_cells": 1
        }).execute()

        return {
            "status": "SUCCESS",
            "grid_code": grid_code
        }

    except Exception as e:
        error_msg = f"Prediction Error for {grid_code}: {str(e)}"
        logger.error(error_msg)
        
        try:
            db.table("prediction_job_events").insert({
                "run_id": run_id,
                "event_type": "TASK_FAILED",
                "message": error_msg,
                "processed_cells": 1,
                "total_cells": 1
            }).execute()
        except Exception as inner_e:
            logger.error(f"Failed to insert TASK_FAILED event: {inner_e}")

        # Return terminal result instead of Celery exception to keep chord alive
        return {
            "status": "FAILED",
            "grid_code": grid_code,
            "error": error_msg
        }

@celery_app.task(name="finish_run")
def finish_run(results: list, run_id: str):
    logger.info(f"Finishing run {run_id} with {len(results)} results")
    db = get_supabase_client()
    
    successful = sum(1 for r in results if r.get("status") == "SUCCESS")
    failed = sum(1 for r in results if r.get("status") == "FAILED")
    
    processed = successful + failed
    
    error_summary = None
    if failed > 0:
        errors = [r.get("error") for r in results if r.get("status") == "FAILED"]
        error_summary = f"{failed} grids failed. First error: {errors[0] if errors else 'Unknown'}"
    
    # Update prediction_runs terminal state
    status = "COMPLETED" if processed > 0 else "FAILED"
    
    db.table("prediction_runs").update({
        "status": status,
        "processed_cells": processed,
        "completed_at": datetime.utcnow().isoformat(),
        "error_summary": error_summary
    }).eq("id", run_id).execute()
    
    db.table("prediction_job_events").insert({
        "run_id": run_id,
        "event_type": "RUN_COMPLETED",
        "message": f"Run finalized. Success: {successful}, Failed: {failed}",
        "processed_cells": processed,
        "total_cells": processed
    }).execute()
    
    return {"status": status, "processed_cells": processed, "successful": successful, "failed": failed}
