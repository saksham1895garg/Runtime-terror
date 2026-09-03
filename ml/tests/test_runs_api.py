import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

@patch("app.api.runs.get_supabase_client")
def test_get_run_status(mock_get_supabase):
    from app.db.supabase import get_supabase_client
    mock_db = MagicMock()
    
    class MockResponse:
        def __init__(self, data):
            self.data = data
            self.count = 2
            
    def db_table_side_effect(table_name):
        mock_table = MagicMock()
        if table_name == "prediction_runs":
            res = MockResponse([{
                "id": "run-1",
                "status": "COMPLETED",
                "total_cells": 2,
                "processed_cells": 2,
                "error_summary": "1 error",
                "model_name": "test",
                "model_version": "v1"
            }])
            mock_table.select.return_value.eq.return_value.execute.return_value = res
        elif table_name == "prediction_job_events":
            res = MockResponse([
                {"event_type": "TASK_COMPLETED", "created_at": "2026-01-01T00:00"},
                {"event_type": "TASK_FAILED", "created_at": "2026-01-01T00:01"}
            ])
            # Paginated mock
            mock_table.select.return_value.eq.return_value.range.return_value.execute.side_effect = [res, MockResponse([])]
        return mock_table
        
    mock_db.table.side_effect = db_table_side_effect
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    
    response = client.get("/runs/run-1")
    app.dependency_overrides = {}
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["successful_cells"] == 1
    assert data["failed_cells"] == 1
    assert data["processed_cells"] == 2
    assert data["progress_percent"] == 100.0
    assert data["completion_outcome"] == "PARTIAL_SUCCESS"

@patch("app.api.runs.get_supabase_client")
def test_list_runs(mock_get_supabase):
    from app.db.supabase import get_supabase_client
    mock_db = MagicMock()
    
    class MockResponse:
        def __init__(self, data, count=1):
            self.data = data
            self.count = count
            
    mock_table = MagicMock()
    res = MockResponse([{
        "id": "run-1",
        "status": "FAILED",
        "total_cells": 2,
        "processed_cells": 0,
        "error_summary": "Failed early"
    }])
    mock_table.select.return_value.order.return_value.range.return_value.execute.return_value = res
    mock_db.table.return_value = mock_table
    
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    response = client.get("/runs?limit=10")
    app.dependency_overrides = {}
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["runs"]) == 1
    assert data["runs"][0]["completion_outcome"] == "FAILED"
    assert data["runs"][0]["progress_percent"] == 0.0

@patch("app.api.runs.get_supabase_client")
def test_get_run_recovery(mock_get_supabase):
    from app.db.supabase import get_supabase_client
    mock_db = MagicMock()
    
    class MockResponse:
        def __init__(self, data):
            self.data = data
            
    def db_table_side_effect(table_name):
        mock_table = MagicMock()
        if table_name == "prediction_runs":
            res = MockResponse([{"id": "run-1"}])
            mock_table.select.return_value.eq.return_value.execute.return_value = res
        elif table_name == "analysis_grid_cells":
            # 2 cells
            res = MockResponse([{"grid_code": "G1"}, {"grid_code": "G2"}])
            mock_table.select.return_value.range.return_value.execute.side_effect = [res, MockResponse([])]
        elif table_name == "risk_predictions":
            # 1 success
            res = MockResponse([{"grid_code": "G1"}])
            mock_table.select.return_value.eq.return_value.range.return_value.execute.side_effect = [res, MockResponse([])]
        elif table_name == "prediction_job_events":
            # 2 started, 1 completed, 0 failed. So G2 is incomplete/stale
            res = MockResponse([
                {"event_type": "TASK_STARTED", "message": "Test prediction job started for G1"},
                {"event_type": "TASK_STARTED", "message": "Test prediction job started for G2"},
                {"event_type": "TASK_COMPLETED", "message": "Test prediction completed successfully for G1"}
            ])
            mock_table.select.return_value.eq.return_value.range.return_value.execute.side_effect = [res, MockResponse([])]
        return mock_table
        
    mock_db.table.side_effect = db_table_side_effect
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    
    response = client.get("/runs/run-1/recovery")
    app.dependency_overrides = {}
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["failed_grids"]) == 0
    assert len(data["incomplete_grids"]) == 1
    assert data["incomplete_grids"][0] == "G2"
    assert len(data["missing_predictions"]) == 0
    assert len(data["unprocessed_grids"]) == 0
