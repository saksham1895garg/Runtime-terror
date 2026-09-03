from app.model.predictor import TestPredictor, RealModelPredictor, ModelNotAvailableError, ModelArtifactNotFoundError
from app.features.test_generator import TestFeatureGenerator
from app.model.factory import get_predictor
from app.core.config import settings
import pytest
import os
from unittest.mock import MagicMock

def test_test_predictor_deterministic():
    generator = TestFeatureGenerator()
    features = generator.acquire("GNG-000026").to_grid_features()
    
    predictor = TestPredictor()
    result = predictor.predict(features)
    
    assert result.model_name == "TEST_PREDICTOR"
    assert result.risk_score >= 0 and result.risk_score <= 100
    assert result.risk_category in ["LOW", "MODERATE", "HIGH", "SEVERE"]
    assert result.confidence > 0

def test_real_model_predictor_raises(monkeypatch):
    generator = TestFeatureGenerator()
    features = generator.acquire("GNG-000026").to_grid_features()
    
    # Mock exists so it initializes
    monkeypatch.setattr(os.path, "exists", lambda path: True)
    import joblib
    monkeypatch.setattr(joblib, "load", lambda path: MagicMock())

    predictor = RealModelPredictor("some_path.pkl", "REAL_MODEL", "v1")
    
    with pytest.raises(ValueError) as exc_info:
        predictor.predict(features)
    
    assert "Missing model_features" in str(exc_info.value)

def test_get_predictor_factory(monkeypatch):
    monkeypatch.setattr(settings, "MODEL_BACKEND", "TEST")
    pred = get_predictor()
    assert isinstance(pred, TestPredictor)
    
    monkeypatch.setattr(settings, "MODEL_BACKEND", "PRODUCTION")
    
    # By default, os.path.exists for None or invalid will be False, so it should raise ModelArtifactNotFoundError
    with pytest.raises(ModelArtifactNotFoundError):
        get_predictor()
