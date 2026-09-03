from fastapi import APIRouter, HTTPException, status
import logging
from app.tasks.test_tasks import test_task

# Catch common connection exceptions from Kombu/Redis
try:
    from kombu.exceptions import OperationalError as KombuOperationalError
    from redis.exceptions import RedisError
except ImportError:
    KombuOperationalError = Exception
    RedisError = Exception

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/test", status_code=status.HTTP_202_ACCEPTED)
def trigger_test_task():
    try:
        task = test_task.delay()
        return {
            "task_id": task.id,
            "status": "QUEUED"
        }
    except (KombuOperationalError, RedisError, ConnectionError) as e:
        logger.error(f"Failed to connect to Celery broker: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Background task broker is currently unavailable. Please try again later."
        )
    except Exception as e:
        logger.error(f"Unexpected error queuing task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while queuing the task."
        )

from app.schemas.tasks import GEEFeatureTestRequest, TestPredictionRequest, TaskStatusResponse
from app.tasks.gee_tasks import acquire_gee_features
from app.tasks.celery_app import celery_app

@router.post("/gee-feature-test", response_model=TaskStatusResponse, status_code=status.HTTP_202_ACCEPTED)
def trigger_gee_feature_task(req: GEEFeatureTestRequest):
    try:
        task = acquire_gee_features.delay(req.grid_code)
        return TaskStatusResponse(
            task_id=task.id,
            status="QUEUED"
        )
    except (KombuOperationalError, RedisError, ConnectionError) as e:
        logger.error(f"Failed to connect to Celery broker: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Background task broker is currently unavailable. Please try again later."
        )
    except Exception as e:
        logger.error(f"Unexpected error queuing GEE task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while queuing the task."
        )

from app.schemas.prediction import TestRunRequest, TestRunResponse
from app.tasks.prediction_tasks import run_grid_prediction, finish_run
from celery import chord
import uuid
from datetime import datetime
from app.db.supabase import get_supabase_client

@router.post("/test-run", response_model=TestRunResponse, status_code=status.HTTP_202_ACCEPTED)
def trigger_test_run(req: TestRunRequest):
    grid_codes = req.grid_codes
    if not grid_codes:
        raise HTTPException(status_code=400, detail="grid_codes list cannot be empty")
        
    # De-duplicate
    unique_grids = list(set(grid_codes))
    
    if len(unique_grids) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 unique grids allowed for development test run")
        
    db = get_supabase_client()
    
    # Validate grids exist
    res = db.table("analysis_grid_cells").select("grid_code").in_("grid_code", unique_grids).execute()
    valid_grids = [r["grid_code"] for r in res.data] if res.data else []
    
    invalid_grids = set(unique_grids) - set(valid_grids)
    if invalid_grids:
        raise HTTPException(status_code=400, detail=f"Invalid grid codes: {', '.join(invalid_grids)}")
        
    run_id = str(uuid.uuid4())
    
    try:
        db.table("prediction_runs").insert({
            "id": run_id,
            "status": "RUNNING",
            "model_name": "TEST_PREDICTOR",
            "model_version": "TEST-v1",
            "trigger_source": "AUTOMATED",
            "total_cells": len(valid_grids),
            "processed_cells": 0,
            "started_at": datetime.utcnow().isoformat()
        }).execute()
        
        db.table("prediction_job_events").insert({
            "run_id": run_id,
            "event_type": "RUN_CREATED",
            "message": f"Run created for {len(valid_grids)} grids",
            "processed_cells": 0,
            "total_cells": len(valid_grids)
        }).execute()
        
    except Exception as e:
        logger.error(f"Failed to initialize run in DB: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize run in database")
        
    try:
        # Create chord
        header = [run_grid_prediction.s(run_id, g) for g in valid_grids]
        callback = finish_run.s(run_id)
        
        result = chord(header)(callback)
        
        # The result of a chord is the AsyncResult of the callback
        task_ids = [t.id for t in result.parent.children] if result.parent else []
        
        return TestRunResponse(
            run_id=run_id,
            task_ids=task_ids,
            status="QUEUED"
        )
    except (KombuOperationalError, RedisError, ConnectionError) as e:
        logger.error(f"Failed to connect to Celery broker: {e}")
        # Mark run as failed
        db.table("prediction_runs").update({"status": "FAILED", "error_summary": "Broker unavailable"}).eq("id", run_id).execute()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Background task broker is currently unavailable. Please try again later."
        )
    except Exception as e:
        logger.error(f"Unexpected error queuing test run: {e}")
        db.table("prediction_runs").update({"status": "FAILED", "error_summary": str(e)}).eq("id", run_id).execute()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while queuing the test run."
        )

@router.get("/{task_id}", response_model=TaskStatusResponse)
def get_task_status(task_id: str):
    try:
        task = celery_app.AsyncResult(task_id)
        
        response = TaskStatusResponse(
            task_id=task_id,
            status=task.status
        )
        
        if task.status == "SUCCESS":
            response.result = task.result
        elif task.status == "FAILURE":
            # task.result contains the exception string for FAILURE
            response.error = str(task.result)
            
        return response
    except Exception as e:
        logger.error(f"Error fetching task status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve task status."
        )
