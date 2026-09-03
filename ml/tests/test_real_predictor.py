import pytest
import pandas as pd
from app.model.predictor import RealModelPredictor, ModelArtifactNotFoundError
from app.features.schemas import GridFeatures, StaticModelFeatures
import os
from app.core.config import settings
from app.model.factory import get_predictor

def test_missing_artifact():
    with pytest.raises(ModelArtifactNotFoundError):
        RealModelPredictor(model_path="nonexistent/path.joblib", model_name="test", model_version="v1")

def test_feature_names_and_order():
    # Use the real path to test loading
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    real_path = os.path.join(base_dir, "models", "static_model_v1", "gangtok_static_logreg_A2_sigmoid_v1.joblib")
    
    predictor = RealModelPredictor(model_path=real_path, model_name="Test", model_version="v1")
    
    expected_order = [
        "mean_elevation_m", "min_elevation_m", "max_elevation_m",
        "elevation_range_m", "std_elevation_m", "mean_slope_deg",
        "min_slope_deg", "max_slope_deg", "std_slope_deg",
        "p25_slope_deg", "p50_slope_deg", "p75_slope_deg",
        "p90_slope_deg", "mean_aspect_sin", "mean_aspect_cos"
    ]
    assert predictor.feature_cols == expected_order

def test_predictor_output():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    real_path = os.path.join(base_dir, "models", "static_model_v1", "gangtok_static_logreg_A2_sigmoid_v1.joblib")
    
    predictor = RealModelPredictor(model_path=real_path, model_name="Test", model_version="v1")
    
    model_features = StaticModelFeatures(
        mean_elevation_m=1500.0, min_elevation_m=1400.0, max_elevation_m=1600.0,
        elevation_range_m=200.0, std_elevation_m=50.0, mean_slope_deg=30.0,
        min_slope_deg=5.0, max_slope_deg=65.0, std_slope_deg=10.0,
        p25_slope_deg=20.0, p50_slope_deg=30.0, p75_slope_deg=40.0,
        p90_slope_deg=50.0, mean_aspect_sin=0.5, mean_aspect_cos=0.5
    )
    
    grid_features = GridFeatures(
        grid_code="TEST-000",
        elevation=1500.0,
        slope=30.0,
        aspect=45.0,
        rainfall_24h=0.0, rainfall_72h=0.0, rainfall_7d=0.0,
        land_cover="trees",
        susceptibility=0.0,
        is_test_data=True,
        model_features=model_features
    )
    from app.model.predictor import PolicyPendingError
    
    with pytest.raises(PolicyPendingError) as exc_info:
        predictor.predict(grid_features)
        
    assert 0.0 <= exc_info.value.probability <= 1.0
    assert "pending policy" in exc_info.value.message

def test_production_backend_no_fallback(monkeypatch):
    monkeypatch.setattr(settings, "MODEL_BACKEND", "PRODUCTION")
    monkeypatch.setattr(settings, "MODEL_PATH", "fake/path/model.joblib")
    
    # Factory should raise error instead of returning TestPredictor
    with pytest.raises(ModelArtifactNotFoundError):
        get_predictor()
