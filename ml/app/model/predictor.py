from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
from app.features.schemas import GridFeatures
from app.model.schemas import PredictionResult

class PredictorInterface(ABC):
    @abstractmethod
    def predict_probability(self, features: GridFeatures) -> float:
        """Return the raw, calibrated probability of landslide presence."""
        pass

    @abstractmethod
    def predict(self, features: GridFeatures) -> PredictionResult:
        """Return the operational prediction result."""
        pass

class TestPredictor(PredictorInterface):
    """
    A deterministic test predictor for Phase 1-3 development.
    Replace with actual ML model in later phases.
    """
    def predict_probability(self, features: GridFeatures) -> float:
        score_base = (features.slope / 90.0) * 30 + (features.rainfall_7d / 300.0) * 40 + (features.susceptibility) * 30
        risk_score = min(max(int(score_base), 0), 100)
        return risk_score / 100.0

    def predict(self, features: GridFeatures) -> PredictionResult:
        # Deterministic dummy output based on features for testing
        prob = self.predict_probability(features)
        risk_score = int(prob * 100.0)
        
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

class PolicyPendingError(Exception):
    def __init__(self, probability: float, message: str):
        self.probability = probability
        self.message = message
        super().__init__(self.message)

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
            
        import joblib
        self.model = joblib.load(self.model_path)
        self.feature_cols = [
            "mean_elevation_m", "min_elevation_m", "max_elevation_m",
            "elevation_range_m", "std_elevation_m", "mean_slope_deg",
            "min_slope_deg", "max_slope_deg", "std_slope_deg",
            "p25_slope_deg", "p50_slope_deg", "p75_slope_deg",
            "p90_slope_deg", "mean_aspect_sin", "mean_aspect_cos"
        ]

    def predict_probability(self, features: GridFeatures) -> float:
        if not features.model_features:
            raise ValueError(f"Missing model_features for {features.grid_code}. Cannot predict.")
            
        import pandas as pd
        
        # model_dump ensures we get a dict with exactly the fields defined in StaticModelFeatures
        data = features.model_features.model_dump()
        df = pd.DataFrame([data], columns=self.feature_cols)
        
        probs = self.model.predict_proba(df)
        return float(probs[0, 1])

    def predict(self, features: GridFeatures) -> PredictionResult:
        prob_1 = self.predict_probability(features)
        
        raise PolicyPendingError(
            probability=prob_1,
            message=f"Model output probability: {prob_1:.6f}. Operational risk classification is pending policy. Cannot map to HIGH/MODERATE/LOW without an authoritative threshold."
        )
