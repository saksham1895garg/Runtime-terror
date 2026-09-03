from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class PredictionRequest(BaseModel):
    grid_code: str
    
class PredictionResponse(BaseModel):
    run_id: str
    grid_code: str
    risk_score: float
    risk_category: str
    confidence: float
    model_name: str
    model_version: str
    metadata: Optional[Dict[str, Any]] = None

class TestRunRequest(BaseModel):
    grid_codes: list[str]

class TestRunResponse(BaseModel):
    run_id: str
    task_ids: list[str]
    status: str

class RunStatusResponse(BaseModel):
    run_id: str
    status: str
    total_cells: int
    processed_cells: int
    successful_cells: int
    failed_cells: int
    progress_percent: float
    completion_outcome: Optional[str] = None
    created_at: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    failed_at: Optional[str] = None
    duration: Optional[float] = None
    error_summary: Optional[str] = None
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    trigger_source: Optional[str] = None

class RunRecoveryResponse(BaseModel):
    run_id: str
    failed_grids: list[str]
    incomplete_grids: list[str]
    missing_predictions: list[str]
    unprocessed_grids: list[str]

class RunListResponse(BaseModel):
    runs: List[RunStatusResponse]
    total: int
    page: int
    limit: int

class PredictionJobEvent(BaseModel):
    id: int
    run_id: str
    event_type: str
    message: str
    created_at: str

class EventListResponse(BaseModel):
    events: List[PredictionJobEvent]
    total: int
    page: int
    limit: int
