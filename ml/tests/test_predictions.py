import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.main import app
from app.db.supabase import get_supabase_client
from app.model.schemas import PredictionResult

client = TestClient(app)

def mock_get_supabase_client():
    mock_db = MagicMock()
    
    def mock_table(table_name):
        table_mock = MagicMock()
        
        if table_name == "analysis_grid_cells":
            # For validation
            def mock_select(*args, **kwargs):
                sel_mock = MagicMock()
                def mock_eq(col, val):
                    eq_mock = MagicMock()
                    def mock_execute():
                        if val == "GNG-000026":
                            return MagicMock(data=[{"grid_code": val}])
                        return MagicMock(data=[])
                    eq_mock.execute = mock_execute
                    return eq_mock
                sel_mock.eq = mock_eq
                return sel_mock
            table_mock.select = mock_select
            
        elif table_name == "prediction_runs":
            def mock_insert(*args, **kwargs):
                ins_mock = MagicMock()
                ins_mock.execute = MagicMock()
                return ins_mock
            def mock_update(*args, **kwargs):
                upd_mock = MagicMock()
                def mock_eq(col, val):
                    eq_mock = MagicMock()
                    eq_mock.execute = MagicMock()
                    return eq_mock
                upd_mock.eq = mock_eq
                return upd_mock
            table_mock.insert = mock_insert
            table_mock.update = mock_update
            
        else: # risk_predictions, prediction_job_events
            def mock_insert(*args, **kwargs):
                ins_mock = MagicMock()
                ins_mock.execute = MagicMock()
                return ins_mock
            table_mock.insert = mock_insert
            
        return table_mock
        
    mock_db.table = mock_table
    return mock_db

from app.model.factory import get_predictor
from app.model.predictor import PredictorInterface, ModelNotAvailableError, TestPredictor
from app.features.factory import get_feature_provider
from app.features.test_generator import TestFeatureGenerator

app.dependency_overrides[get_supabase_client] = mock_get_supabase_client
# Default to TestPredictor and TestFeatureGenerator for these tests
app.dependency_overrides[get_predictor] = lambda: TestPredictor()
app.dependency_overrides[get_feature_provider] = lambda: TestFeatureGenerator()

def test_prediction_valid_grid():
    response = client.post("/predictions/test", json={"grid_code": "GNG-000026"})
    assert response.status_code == 200
    data = response.json()
    assert data["grid_code"] == "GNG-000026"
    assert "run_id" in data
    assert data["model_name"] == "TEST_PREDICTOR"
    assert data["model_version"] == "TEST-v1"

def test_prediction_invalid_grid():
    response = client.post("/predictions/test", json={"grid_code": "INVALID-GRID"})
    assert response.status_code == 404

def test_prediction_missing_grid():
    response = client.post("/predictions/test", json={})
    assert response.status_code == 422 # FastAPI validation error

def test_prediction_predictor_failure():
    # Override get_predictor for just this test
    class FailingPredictor(PredictorInterface):
        def predict_probability(self, features):
            raise Exception("Simulated predictor failure")
        def predict(self, features):
            raise Exception("Simulated predictor failure")
            
    app.dependency_overrides[get_predictor] = lambda: FailingPredictor()
    
    response = client.post("/predictions/test", json={"grid_code": "GNG-000026"})
    assert response.status_code == 500
    assert "Simulated predictor failure" in response.json()["detail"]
    
    # Reset override
    app.dependency_overrides[get_predictor] = lambda: TestPredictor()

def test_prediction_model_not_available():
    # Test RealModelPredictor placeholder behavior
    class UnavailablePredictor(PredictorInterface):
        def predict_probability(self, features):
            raise ModelNotAvailableError("Model not found")
        def predict(self, features):
            raise ModelNotAvailableError("Model not found")
            
    app.dependency_overrides[get_predictor] = lambda: UnavailablePredictor()
    
    response = client.post("/predictions/test", json={"grid_code": "GNG-000026"})
    assert response.status_code == 503
    assert "Model not found" in response.json()["detail"]
    
    # Reset override
    app.dependency_overrides[get_predictor] = lambda: TestPredictor()
