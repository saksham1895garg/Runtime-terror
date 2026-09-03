from fastapi import APIRouter, HTTPException, Depends, Query
from supabase import Client
from app.db.supabase import get_supabase_client
from app.schemas.prediction import (
    RunStatusResponse, RunRecoveryResponse, 
    RunListResponse, EventListResponse, PredictionJobEvent
)
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

def fetch_all_events(db: Client, run_id: str):
    events = []
    limit = 1000
    offset = 0
    while True:
        res = db.table("prediction_job_events")\
            .select("message, event_type, created_at")\
            .eq("run_id", run_id)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        events.extend(res.data)
        if not res.data or len(res.data) < limit:
            break
        offset += limit
    return events

@router.get("", response_model=RunListResponse)
def list_runs(
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    status: str = Query(None),
    model_name: str = Query(None),
    db: Client = Depends(get_supabase_client)
):
    offset = (page - 1) * limit
    
    query = db.table("prediction_runs").select("*", count="exact")
    if status:
        query = query.eq("status", status)
    if model_name:
        query = query.eq("model_name", model_name)
        
    res = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    
    runs = []
    for r in res.data:
        # Calculate dynamic fields if needed
        successful_cells = 0
        failed_cells = 0
        
        processed_cells = r.get("processed_cells") or 0
        total_cells = r.get("total_cells") or 1
        prog = min(100.0, (processed_cells / total_cells) * 100.0)
        
        dur = None
        started = r.get("started_at")
        ended = r.get("completed_at") or r.get("failed_at")
        if started and ended:
            try:
                s_time = datetime.fromisoformat(started.replace("Z", "+00:00"))
                e_time = datetime.fromisoformat(ended.replace("Z", "+00:00"))
                dur = (e_time - s_time).total_seconds()
            except:
                pass

        completion_outcome = None
        if r["status"] in ["COMPLETED", "FAILED"]:
            # We don't have successful_cells in DB, so we deduce it if not fetching events
            # For the list view, we just use processed_cells and fallback logic to save DB load
            if r["error_summary"]:
                completion_outcome = "PARTIAL_SUCCESS" if processed_cells > 0 else "FAILED"
            else:
                completion_outcome = "SUCCESS" if r["status"] == "COMPLETED" else "FAILED"

        runs.append(RunStatusResponse(
            run_id=r["id"],
            status=r["status"],
            total_cells=total_cells,
            processed_cells=processed_cells,
            successful_cells=successful_cells,
            failed_cells=failed_cells,
            progress_percent=prog,
            completion_outcome=completion_outcome,
            created_at=r.get("created_at"),
            started_at=r.get("started_at"),
            completed_at=r.get("completed_at"),
            failed_at=r.get("failed_at"),
            duration=dur,
            error_summary=r.get("error_summary"),
            model_name=r.get("model_name"),
            model_version=r.get("model_version"),
            trigger_source=r.get("trigger_source")
        ))
        
    return RunListResponse(
        runs=runs,
        total=res.count or 0,
        page=page,
        limit=limit
    )

@router.get("/{run_id}/recovery", response_model=RunRecoveryResponse)
def get_run_recovery(run_id: str, db: Client = Depends(get_supabase_client)):
    # Verify run exists
    run_res = db.table("prediction_runs").select("id").eq("id", run_id).execute()
    if not run_res.data:
        raise HTTPException(status_code=404, detail="Run not found")
        
    # Get all authoritative grids in chunks if needed (2271 rows usually fits in < 3000 but we paginate to be safe)
    all_grids = set()
    offset = 0
    while True:
        res = db.table("analysis_grid_cells").select("grid_code").range(offset, offset + 1000 - 1).execute()
        for g in res.data:
            all_grids.add(g["grid_code"])
        if len(res.data) < 1000:
            break
        offset += 1000
    
    successful_grids = set()
    offset = 0
    while True:
        res = db.table("risk_predictions").select("grid_code").eq("run_id", run_id).range(offset, offset + 1000 - 1).execute()
        for g in res.data:
            successful_grids.add(g["grid_code"])
        if len(res.data) < 1000:
            break
        offset += 1000
    
    events = fetch_all_events(db, run_id)
    
    started_grids = set()
    completed_grids = set()
    explicitly_failed_grids = set()
    
    for e in events:
        msg = e.get("message", "")
        etype = e.get("event_type")
        
        # Extract grid code from messages
        if etype == "TASK_STARTED" and "started for " in msg:
            started_grids.add(msg.split("started for ")[1].strip())
        elif etype == "TASK_COMPLETED" and "successfully for " in msg:
            completed_grids.add(msg.split("successfully for ")[1].strip())
        elif etype == "TASK_FAILED":
            if "for GNG-" in msg:
                # E.g. "Prediction Error for GNG-000030: ..."
                parts = msg.split("for ")
                if len(parts) > 1:
                    code = parts[1].split(":")[0].strip()
                    explicitly_failed_grids.add(code)

    failed_grids = explicitly_failed_grids
    incomplete_grids = started_grids - completed_grids - explicitly_failed_grids
    missing_predictions = completed_grids - successful_grids
    unprocessed_grids = all_grids - started_grids
    
    return RunRecoveryResponse(
        run_id=run_id,
        failed_grids=list(failed_grids),
        incomplete_grids=list(incomplete_grids),
        missing_predictions=list(missing_predictions),
        unprocessed_grids=list(unprocessed_grids)
    )

@router.get("/{run_id}/events", response_model=EventListResponse)
def get_run_events(
    run_id: str,
    event_type: str = Query(None),
    limit: int = Query(50, ge=1, le=500),
    page: int = Query(1, ge=1),
    db: Client = Depends(get_supabase_client)
):
    offset = (page - 1) * limit
    
    query = db.table("prediction_job_events").select("*", count="exact").eq("run_id", run_id)
    if event_type:
        query = query.eq("event_type", event_type)
        
    res = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    
    events = []
    for r in res.data:
        events.append(PredictionJobEvent(
            id=r["id"],
            run_id=r["run_id"],
            event_type=r["event_type"],
            message=r["message"],
            created_at=r["created_at"]
        ))
        
    return EventListResponse(
        events=events,
        total=res.count or 0,
        page=page,
        limit=limit
    )

@router.get("/{run_id}", response_model=RunStatusResponse)
def get_run_status(run_id: str, db: Client = Depends(get_supabase_client)):
    # 1. Get prediction_runs row
    run_res = db.table("prediction_runs").select("*").eq("id", run_id).execute()
    if not run_res.data:
        raise HTTPException(status_code=404, detail="Run not found")
        
    run_data = run_res.data[0]
    
    events = fetch_all_events(db, run_id)
    
    successful_cells = sum(1 for e in events if e.get("event_type") == "TASK_COMPLETED")
    failed_cells = sum(1 for e in events if e.get("event_type") == "TASK_FAILED")
                
    processed_cells = successful_cells + failed_cells
    total_cells = run_data.get("total_cells") or 1
    prog = min(100.0, (processed_cells / total_cells) * 100.0)

    dur = None
    started = run_data.get("started_at")
    ended = run_data.get("completed_at") or run_data.get("failed_at")
    if started and ended:
        try:
            s_time = datetime.fromisoformat(started.replace("Z", "+00:00"))
            e_time = datetime.fromisoformat(ended.replace("Z", "+00:00"))
            dur = (e_time - s_time).total_seconds()
        except:
            pass

    completion_outcome = None
    if run_data["status"] in ["COMPLETED", "FAILED"]:
        if failed_cells == 0 and successful_cells > 0:
            completion_outcome = "SUCCESS"
        elif successful_cells > 0 and failed_cells > 0:
            completion_outcome = "PARTIAL_SUCCESS"
        elif successful_cells == 0 and failed_cells > 0:
            completion_outcome = "FAILED"
        elif successful_cells == 0 and failed_cells == 0:
            completion_outcome = run_data["status"]

    return RunStatusResponse(
        run_id=run_id,
        status=run_data["status"],
        total_cells=total_cells,
        processed_cells=processed_cells,
        successful_cells=successful_cells,
        failed_cells=failed_cells,
        progress_percent=prog,
        completion_outcome=completion_outcome,
        created_at=run_data.get("created_at"),
        started_at=run_data.get("started_at"),
        completed_at=run_data.get("completed_at"),
        failed_at=run_data.get("failed_at"),
        duration=dur,
        error_summary=run_data.get("error_summary"),
        model_name=run_data.get("model_name"),
        model_version=run_data.get("model_version"),
        trigger_source=run_data.get("trigger_source")
    )
