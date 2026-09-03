from pydantic import BaseModel
from typing import Optional, Dict, Any

class PredictionResult(BaseModel):
    risk_score: float
    risk_category: str
    confidence: float
    model_name: str
    model_version: str
    metadata: Optional[Dict[str, Any]] = None
    explanation: Optional[Dict[str, Any]] = None
