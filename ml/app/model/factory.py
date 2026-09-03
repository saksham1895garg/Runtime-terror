from app.core.config import settings
from app.model.predictor import PredictorInterface, TestPredictor, RealModelPredictor

def get_predictor() -> PredictorInterface:
    if settings.MODEL_BACKEND == "PRODUCTION":
        return RealModelPredictor(
            model_path=settings.MODEL_PATH,
            model_name=settings.MODEL_NAME,
            model_version=settings.MODEL_VERSION
        )
    return TestPredictor()
