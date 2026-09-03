from pydantic import BaseModel
from typing import Optional, Dict, Any

class GEEFeatureTestRequest(BaseModel):
    grid_code: str

class TestPredictionRequest(BaseModel):
    grid_code: str

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
