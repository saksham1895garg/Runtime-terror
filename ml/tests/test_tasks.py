import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.tasks.test_tasks import test_task

client = TestClient(app)

def test_celery_task_direct_execution():
    """Test that the deterministic task runs and returns correctly locally."""
    result = test_task()
    assert result["status"] == "success"
    assert result["message"] == "Celery worker is operational"

@patch("app.api.tasks.test_task.delay")
def test_post_tasks_test_success(mock_delay):
    """Test queuing a task successfully."""
    # Mock celery returning a task ID
    mock_task = MagicMock()
    mock_task.id = "mock-task-1234"
    mock_delay.return_value = mock_task
    
    response = client.post("/tasks/test")
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "QUEUED"
    assert data["task_id"] == "mock-task-1234"
    mock_delay.assert_called_once()

@patch("app.api.tasks.test_task.delay")
def test_post_tasks_test_broker_failure(mock_delay):
    """Test graceful failure when the broker is down."""
    from kombu.exceptions import OperationalError
    
    mock_delay.side_effect = OperationalError("Connection refused")
    
    response = client.post("/tasks/test")
    assert response.status_code == 503
    data = response.json()
    assert "unavailable" in data["detail"]
    mock_delay.assert_called_once()
