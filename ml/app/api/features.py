from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from app.db.supabase import get_supabase_client
from app.schemas.prediction import PredictionRequest
from app.features.factory import get_feature_provider
from app.features.base import FeatureProviderInterface
from app.gee.schemas import AcquiredFeatures

router = APIRouter()

@router.post("/gee/test", response_model=AcquiredFeatures)
def test_gee_extraction(
    request: PredictionRequest,
    db: Client = Depends(get_supabase_client),
    feature_provider: FeatureProviderInterface = Depends(get_feature_provider)
):
    grid_code = request.grid_code

    if not grid_code:
        raise HTTPException(status_code=400, detail="grid_code is required")

    res = db.table("analysis_grid_cells").select("grid_code").eq("grid_code", grid_code).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail=f"Grid code {grid_code} not found")
        
    try:
        acquired_features = feature_provider.acquire(grid_code, db)
        return acquired_features
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
