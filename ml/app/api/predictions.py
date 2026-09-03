import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from app.db.supabase import get_supabase_client
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.model.factory import get_predictor
from app.model.predictor import PredictorInterface, ModelNotAvailableError
from app.features.factory import get_feature_provider
from app.features.base import FeatureProviderInterface
from app.gee.errors import FeatureSetIncompleteError

router = APIRouter()

@router.get("/grid/{grid_code}/latest")
def get_latest_prediction(
    grid_code: str,
    db: Client = Depends(get_supabase_client)
):
    res = db.table("risk_predictions") \
            .select("*") \
            .eq("grid_code", grid_code) \
            .order("generated_at", desc=True) \
            .limit(1) \
            .execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="No prediction history for this grid.")
    
    return res.data[0]

@router.post("/test", response_model=PredictionResponse)
def run_test_prediction(
    request: PredictionRequest,
    db: Client = Depends(get_supabase_client),
    predictor: PredictorInterface = Depends(get_predictor),
    feature_provider: FeatureProviderInterface = Depends(get_feature_provider)
):
    grid_code = request.grid_code

    if not grid_code:
        raise HTTPException(status_code=400, detail="grid_code is required")

    res = db.table("analysis_grid_cells").select("grid_code").eq("grid_code", grid_code).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail=f"Grid code {grid_code} not found")

    run_id = str(uuid.uuid4())
    try:
        db.table("prediction_runs").insert({
            "id": run_id,
            "model_name": "UNKNOWN", # Will be updated later
            "model_version": "UNKNOWN",
            "status": "RUNNING",
            "trigger_source": "AUTOMATED",
            "total_cells": 1,
            "processed_cells": 0,
            "started_at": datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create run: {str(e)}")

    try:
        db.table("prediction_job_events").insert({
            "run_id": run_id,
            "event_type": "STARTED",
            "message": f"Test prediction started for {grid_code}",
            "processed_cells": 0,
            "total_cells": 1
        }).execute()
    except Exception as e:
        pass

    try:
        acquired_features = feature_provider.acquire(grid_code, db)
        features = acquired_features.to_grid_features()
        
        result = predictor.predict(features)
        
        risk_id = str(uuid.uuid4())
        db.table("risk_predictions").insert({
            "id": risk_id,
            "run_id": run_id,
            "grid_code": grid_code,
            "risk_score": result.risk_score,
            "risk_category": result.risk_category,
            "confidence": result.confidence,
            "model_name": result.model_name,
            "model_version": result.model_version,
            "input_snapshot": result.metadata,
            "explanation": result.explanation
        }).execute()

        # 9. Create a prediction_job_events completion record
        db.table("prediction_job_events").insert({
            "run_id": run_id,
            "event_type": "COMPLETED",
            "message": f"Test prediction completed for {grid_code}",
            "processed_cells": 1,
            "total_cells": 1
        }).execute()

        # 10. Update prediction_runs processed_cells = 1 and appropriate completed status
        db.table("prediction_runs").update({
            "model_name": result.model_name,
            "model_version": result.model_version,
            "status": "COMPLETED",
            "processed_cells": 1,
            "completed_at": datetime.utcnow().isoformat()
        }).eq("id", run_id).execute()

        # 11. Return response
        return PredictionResponse(
            run_id=run_id,
            grid_code=grid_code,
            risk_score=result.risk_score,
            risk_category=result.risk_category,
            confidence=result.confidence,
            model_name=result.model_name,
            model_version=result.model_version,
            metadata=result.metadata
        )

    except FeatureSetIncompleteError as e:
        db.table("prediction_runs").update({
            "status": "FAILED",
            "failed_at": datetime.utcnow().isoformat(),
            "error_summary": str(e)
        }).eq("id", run_id).execute()
        
        db.table("prediction_job_events").insert({
            "run_id": run_id,
            "event_type": "FAILED",
            "message": f"Prediction failed: {str(e)}",
            "processed_cells": 0,
            "total_cells": 1
        }).execute()

        raise HTTPException(status_code=503, detail=str(e))
        
    except ModelNotAvailableError as e:
        # Controlled error for model not available
        db.table("prediction_runs").update({
            "status": "FAILED",
            "failed_at": datetime.utcnow().isoformat(),
            "error_summary": str(e)
        }).eq("id", run_id).execute()
        
        db.table("prediction_job_events").insert({
            "run_id": run_id,
            "event_type": "FAILED",
            "message": f"Prediction failed: {str(e)}",
            "processed_cells": 0,
            "total_cells": 1
        }).execute()

        raise HTTPException(status_code=503, detail=str(e))
        
    except Exception as e:
        db.table("prediction_runs").update({
            "status": "FAILED",
            "failed_at": datetime.utcnow().isoformat(),
            "error_summary": str(e)
        }).eq("id", run_id).execute()
        
        db.table("prediction_job_events").insert({
            "run_id": run_id,
            "event_type": "FAILED",
            "message": f"Test prediction failed: {str(e)}",
            "processed_cells": 0,
            "total_cells": 1
        }).execute()

        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
