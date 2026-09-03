from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
from app.features.schemas import GridFeatures
from app.model.schemas import PredictionResult

class PredictorInterface(ABC):
    @abstractmethod
    def predict(self, features: GridFeatures) -> PredictionResult:
        pass

class TestPredictor(PredictorInterface):
    """
    A deterministic test predictor for Phase 1-3 development.
    Replace with actual ML model in later phases.
    """
    def predict(self, features: GridFeatures) -> PredictionResult:
        # Deterministic dummy output based on features for testing
        
        # Simple heuristic for dummy score:
        # High rainfall + high slope + high susceptibility = higher risk
        score_base = (features.slope / 90.0) * 30 + (features.rainfall_7d / 300.0) * 40 + (features.susceptibility) * 30
        risk_score = min(max(int(score_base), 0), 100)
        
        if risk_score >= 70:
            risk_category = "HIGH"
        elif risk_score >= 40:
            risk_category = "MODERATE"
        else:
            risk_category = "LOW"
            
        return PredictionResult(
            risk_score=risk_score,
            risk_category=risk_category,
            confidence=0.95,
            model_name="TEST_PREDICTOR",
            model_version="TEST-v1",
            metadata=features.model_dump(), # Store features in metadata
            explanation={"note": "This is a deterministic test prediction"}
        )

import os

class ModelNotAvailableError(Exception):
    pass

class ModelArtifactNotFoundError(Exception):
    pass

class RealModelPredictor(PredictorInterface):
    """
    Adapter for the future production model.
    """
    def __init__(self, model_path: Optional[str], model_name: str, model_version: str):
        self.model_path = model_path
        self.model_name = model_name
        self.model_version = model_version
        
        if not self.model_path or not os.path.exists(self.model_path):
            raise ModelArtifactNotFoundError(
                f"Production model artifact '{self.model_path}' not found. "
                "Cannot initialize PRODUCTION backend."
            )

    def predict(self, features: GridFeatures) -> PredictionResult:
        # We explicitly raise an error if this is called before implementation, because we don't have a model yet.
        raise ModelNotAvailableError(
            f"Production model '{self.model_name}' (v{self.model_version}) is not fully implemented for inference."
        )
