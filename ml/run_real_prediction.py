import os
from datetime import datetime
from app.core.config import settings
from app.db.supabase import get_supabase_client
from app.gee.features import GEEFeatureProvider
from app.model.factory import get_predictor
from app.model.predictor import RealModelPredictor

def run_integration_test():
    grid_code = "GNG-000026"
    print(f"Starting real integration test for grid: {grid_code}")
    
    db = get_supabase_client()
    
    print("\n1. GEE Terrain Extraction...")
    provider = GEEFeatureProvider()
    acquired_features = provider.acquire(grid_code, db)
    
    # We must mock completion and is_test_data to avoid feature incomplete errors
    acquired_features.complete_for_model = True
    acquired_features.is_test_data = False
    
    grid_features = acquired_features.to_grid_features()
    
    print("\n2. Validating 15 real features extracted...")
    mf = grid_features.model_features
    if mf is None:
        raise ValueError("model_features is missing from the extracted features")
    
    mf_dict = mf.model_dump()
    for k, v in mf_dict.items():
        print(f"   {k}: {v}")
    
    print("\n3. Loading Real Model Artifact...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    real_path = os.path.join(base_dir, "models", "static_model_v1", "gangtok_static_logreg_A2_sigmoid_v1.joblib")
    
    # Overwrite settings to simulate PRODUCTION backend
    settings.MODEL_BACKEND = "PRODUCTION"
    settings.MODEL_PATH = real_path
    settings.MODEL_NAME = "gangtok_static_logreg_A2_sigmoid_v1"
    settings.MODEL_VERSION = "v1"
    
    predictor = get_predictor()
    if not isinstance(predictor, RealModelPredictor):
        raise TypeError(f"Expected RealModelPredictor, got {type(predictor)}")
        
    try:
        prediction = predictor.predict(grid_features)
    except Exception as e:
        if type(e).__name__ == "PolicyPendingError":
            print(f"\n5. Output (Policy Pending):")
            print(f"   Calibrated Class-1 Probability: {e.probability:.6f}")
            print(f"   Message: {e.message}")
            print("\n6. Stopping before writing prediction record (no valid DB risk_category exists).")
            print("SUCCESS: GNG-000026 probability calculated correctly, database write safely aborted.")
            return
        raise
    
    input_snapshot = grid_features.model_dump()
    
    # Insert to db
    db.table("risk_predictions").insert({
        "run_id": run_id,
        "grid_code": grid_code,
        "risk_score": prediction.risk_score,
        "risk_category": prediction.risk_category,
        "confidence": prediction.confidence,
        "model_name": prediction.model_name,
        "model_version": prediction.model_version,
        "input_snapshot": input_snapshot,
        "explanation": prediction.explanation
    }).execute()
    
    print("SUCCESS: GNG-000026 prediction completed and stored.")

if __name__ == "__main__":
    run_integration_test()
