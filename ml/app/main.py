from fastapi import FastAPI
from app.api import health, predictions, features, tasks, runs
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Landslide Predictor ML Backend")

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
app.include_router(features.router, prefix="/features", tags=["features"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(runs.router, prefix="/runs", tags=["runs"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Dhara-Soochak ML API"}
