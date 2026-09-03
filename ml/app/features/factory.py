from app.core.config import settings
from app.features.base import FeatureProviderInterface
from app.features.test_generator import TestFeatureGenerator

def get_feature_provider() -> FeatureProviderInterface:
    if settings.FEATURE_BACKEND == "GEE":
        from app.gee.features import GEEFeatureProvider
        return GEEFeatureProvider()
    return TestFeatureGenerator()
