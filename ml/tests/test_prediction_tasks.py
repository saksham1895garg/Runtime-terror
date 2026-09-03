import pytest
from unittest.mock import patch, MagicMock
from app.tasks.prediction_tasks import run_grid_prediction, finish_run
import datetime

@patch("app.tasks.prediction_tasks.get_supabase_client")
@patch("app.tasks.prediction_tasks.TestFeatureGenerator")
@patch("app.tasks.prediction_tasks.TestPredictor")
def test_run_grid_prediction_success(mock_predictor_cls, mock_generator_cls, mock_get_supabase):
    mock_db = MagicMock()
    mock_get_supabase.return_value = mock_db
    
    # 1. No duplicate found
    mock_existing_res = MagicMock()
    mock_existing_res.data = []
    
    def db_table_side_effect(table_name):
        mock_table = MagicMock()
        if table_name == "risk_predictions":
            mock_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_existing_res
            mock_table.insert.return_value.execute.return_value = MagicMock()
        elif table_name == "prediction_job_events":
            mock_table.insert.return_value.execute.return_value = MagicMock()
        return mock_table
        
    mock_db.table.side_effect = db_table_side_effect
    
    # Feature generator
    mock_generator = MagicMock()
    mock_generator_cls.return_value = mock_generator
    mock_acquired_features = MagicMock()
    mock_features = MagicMock()
    mock_features.model_dump.return_value = {"elevation": 100}
    mock_acquired_features.to_grid_features.return_value = mock_features
    mock_generator.acquire.return_value = mock_acquired_features
    
    # Predictor
    mock_predictor = MagicMock()
    mock_predictor_cls.return_value = mock_predictor
    mock_prediction = MagicMock()
    mock_prediction.risk_score = 0.8
    mock_prediction.risk_category = "HIGH"
    mock_prediction.confidence = 0.9
    mock_prediction.explanation = {"contributing_factors": ["elevation"]}
    mock_predictor.predict.return_value = mock_prediction
    
    # Execute
    result = run_grid_prediction("run-123", "GNG-000026")
    
    assert result["status"] == "SUCCESS"
    assert result["grid_code"] == "GNG-000026"

@patch("app.tasks.prediction_tasks.get_supabase_client")
def test_run_grid_prediction_duplicate(mock_get_supabase):
    mock_db = MagicMock()
    mock_get_supabase.return_value = mock_db
    
    # Duplicate found
    mock_existing_res = MagicMock()
    mock_existing_res.data = [{"id": "exists"}]
    
    mock_table = MagicMock()
    mock_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_existing_res
    mock_db.table.return_value = mock_table
    
    result = run_grid_prediction("run-123", "GNG-000026")
    
    assert result["status"] == "FAILED"
    assert "Duplicate" in result["error"]

@patch("app.tasks.prediction_tasks.get_supabase_client")
@patch("app.tasks.prediction_tasks.TestFeatureGenerator")
def test_run_grid_prediction_exception_isolation(mock_generator_cls, mock_get_supabase):
    mock_db = MagicMock()
    mock_get_supabase.return_value = mock_db
    
    mock_existing_res = MagicMock()
    mock_existing_res.data = []
    
    mock_table = MagicMock()
    mock_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_existing_res
    mock_db.table.return_value = mock_table
    
    # Force exception
    mock_generator = MagicMock()
    mock_generator.acquire.side_effect = Exception("Test Failure")
    mock_generator_cls.return_value = mock_generator
    
    result = run_grid_prediction("run-123", "GNG-000026")
    
    assert result["status"] == "FAILED"
    assert "Test Failure" in result["error"]

@patch("app.tasks.prediction_tasks.get_supabase_client")
def test_finish_run_success(mock_get_supabase):
    mock_db = MagicMock()
    mock_get_supabase.return_value = mock_db
    
    results = [
        {"status": "SUCCESS", "grid_code": "G1"},
        {"status": "SUCCESS", "grid_code": "G2"}
    ]
    
    result = finish_run(results, "run-123")
    
    assert result["status"] == "COMPLETED"
    assert result["processed_cells"] == 2
    assert result["successful"] == 2
    assert result["failed"] == 0

@patch("app.tasks.prediction_tasks.get_supabase_client")
def test_finish_run_partial(mock_get_supabase):
    mock_db = MagicMock()
    mock_get_supabase.return_value = mock_db
    
    results = [
        {"status": "SUCCESS", "grid_code": "G1"},
        {"status": "FAILED", "grid_code": "G2", "error": "err"}
    ]
    
    result = finish_run(results, "run-123")
    
    assert result["status"] == "COMPLETED"
    assert result["processed_cells"] == 2
    assert result["successful"] == 1
    assert result["failed"] == 1
