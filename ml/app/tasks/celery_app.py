import os
from celery import Celery
from app.core.config import settings

# Load broker URL from settings. Fallback strictly if empty/undefined.
broker_url = settings.REDIS_URL or "redis://localhost:6379/0"

celery_app = Celery(
    "dhara_tasks",
    broker=broker_url,
    backend=broker_url,
    include=['app.tasks.test_tasks', 'app.tasks.gee_tasks', 'app.tasks.prediction_tasks']
)

celery_app.conf.update(
    task_track_started=True,
    # Bounded timeouts for publishing (to fail fast if Redis is down)
    broker_connection_timeout=2.0,
    broker_connection_retry=False,
    broker_connection_retry_on_startup=False,
    broker_connection_max_retries=0,
    broker_pool_limit=None,
    result_backend_transport_options={
        'retry_policy': {
            'timeout': 2.0
        }
    }
)
