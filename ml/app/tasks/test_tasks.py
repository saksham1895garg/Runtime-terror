from app.tasks.celery_app import celery_app

@celery_app.task(name="test_task")
def test_task():
    return {
        "status": "success",
        "message": "Celery worker is operational"
    }
