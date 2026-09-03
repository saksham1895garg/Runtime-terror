from app.core.config import settings
from app.gee.errors import GEEConfigurationError, GEEAuthenticationError
import logging

logger = logging.getLogger(__name__)
_is_initialized = False

def initialize_gee():
    global _is_initialized
    if _is_initialized:
        return
        
    if not settings.GEE_ENABLED:
        raise GEEConfigurationError("GEE is not enabled in settings")
        
    try:
        import ee
    except ImportError:
        raise GEEConfigurationError("earthengine-api is not installed")
        
    try:
        if settings.GEE_PROJECT:
            ee.Initialize(project=settings.GEE_PROJECT)
        else:
            ee.Initialize()
        _is_initialized = True
    except Exception as e:
        logger.error(f"Failed to initialize Earth Engine: {e}")
        raise GEEAuthenticationError(f"Failed to initialize Earth Engine: {str(e)}")
