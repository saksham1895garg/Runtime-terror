from abc import ABC, abstractmethod
from app.gee.schemas import AcquiredFeatures
from supabase import Client

class FeatureProviderInterface(ABC):
    @abstractmethod
    def acquire(self, grid_code: str, db_client: Client) -> AcquiredFeatures:
        pass
