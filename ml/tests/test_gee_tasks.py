import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.tasks.gee_tasks import acquire_gee_features, GEEAsyncError

client = TestClient(app)

@patch("app.tasks.gee_tasks.GEEFeatureProvider")
@patch("app.tasks.gee_tasks.get_supabase_client")
def test_acquire_gee_features_success(mock_get_supabase, mock_provider_class):
    # Mock the returned provider and its acquire method
    mock_provider = MagicMock()
    mock_provider_class.return_value = mock_provider
    
    mock_acquired = MagicMock()
    mock_acquired.features = {
        "elevation": 1500.0,
        "slope": 10.5,
        "aspect": 180.0,
        "rainfall_24h": 10.0,
        "rainfall_72h": 30.0,
        "rainfall_7d": 100.0,
        "land_cover": "trees"
    }
    mock_acquired.susceptibility.status = "UNRESOLVED"
    mock_acquired.susceptibility.source = None
    mock_acquired.complete_for_model = False
    mock_acquired.is_test_data = False
    mock_acquired.lineage = {
        "sources": {
            "rainfall": {"dataset": "CHIRPS", "latest_observation_date": "2026-07-31"},
            "land_cover": {"dataset": "DYNAMICWORLD", "dominant_class_id": 1, "observation_count": 5, "temporal_start": "2026-08-01", "temporal_end": "2026-08-31"}
        }
    }
    
    mock_provider.acquire.return_value = mock_acquired
    
    result = acquire_gee_features("GNG-000026")
    
    assert result["grid_code"] == "GNG-000026"
    assert result["terrain"]["elevation_m"] == 1500.0
    assert result["rainfall"]["rainfall_24h_mm"] == 10.0
    assert result["land_cover"]["dominant_class"] == "trees"
    assert result["susceptibility"]["status"] == "UNRESOLVED"
    assert result["complete_for_model"] is False

@patch("app.tasks.gee_tasks.GEEFeatureProvider")
@patch("app.tasks.gee_tasks.get_supabase_client")
def test_acquire_gee_features_failure(mock_get_supabase, mock_provider_class):
    mock_provider = MagicMock()
    mock_provider_class.return_value = mock_provider
    mock_provider.acquire.side_effect = Exception("Test GEE Exception")
    
    with pytest.raises(GEEAsyncError) as exc_info:
        acquire_gee_features("GNG-000026")
        
    assert "GEE Acquisition Error: Test GEE Exception" in str(exc_info.value)

@patch("app.api.tasks.acquire_gee_features.delay")
def test_post_gee_feature_test(mock_delay):
    mock_task = MagicMock()
    mock_task.id = "gee-task-1234"
    mock_delay.return_value = mock_task
    
    response = client.post("/tasks/gee-feature-test", json={"grid_code": "GNG-000026"})
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "QUEUED"
    assert data["task_id"] == "gee-task-1234"
    mock_delay.assert_called_once_with("GNG-000026")

@patch("app.api.tasks.celery_app.AsyncResult")
def test_get_task_status_success(mock_async_result):
    mock_task = MagicMock()
    mock_task.status = "SUCCESS"
    mock_task.result = {"grid_code": "GNG-000026"}
    mock_async_result.return_value = mock_task
    
    response = client.get("/tasks/gee-task-1234")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["task_id"] == "gee-task-1234"
    assert data["result"]["grid_code"] == "GNG-000026"
    assert data["error"] is None

@patch("app.api.tasks.celery_app.AsyncResult")
def test_get_task_status_failure(mock_async_result):
    mock_task = MagicMock()
    mock_task.status = "FAILURE"
    mock_task.result = Exception("Sanitized safe error")
    mock_async_result.return_value = mock_task
    
    response = client.get("/tasks/gee-task-1234")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "FAILURE"
    assert data["task_id"] == "gee-task-1234"
    assert data["result"] is None
    assert "Sanitized safe error" in data["error"]
