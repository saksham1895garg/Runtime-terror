import hashlib
import random
from app.features.base import FeatureProviderInterface
from app.gee.schemas import AcquiredFeatures, SusceptibilityStatus, FeatureLineage, DatasetLineage
from supabase import Client

class TestFeatureGenerator(FeatureProviderInterface):
    """
    Deterministic feature generator for Phase 3 development.
    Produces synthetic features for a given grid_code.
    """
    def acquire(self, grid_code: str, db_client: Client = None) -> AcquiredFeatures:
        # Create a deterministic seed based on grid_code
        seed = int(hashlib.sha256(grid_code.encode()).hexdigest(), 16) % (10**8)
        rng = random.Random(seed)
        
        # Deterministic generation
        elevation = round(rng.uniform(100.0, 3000.0), 2)
        slope = round(rng.uniform(0.0, 90.0), 2)
        aspect = round(rng.uniform(0.0, 360.0), 2)
        
        # Correlate some rain with each other for realism
        base_rain = rng.uniform(0.0, 50.0)
        rainfall_24h = round(base_rain, 2)
        rainfall_72h = round(base_rain + rng.uniform(0.0, 100.0), 2)
        rainfall_7d = round(rainfall_72h + rng.uniform(0.0, 200.0), 2)
        
        land_covers = ["Forest", "Urban", "Agriculture", "Barren", "Water"]
        land_cover = rng.choice(land_covers)
        
        susceptibility = round(rng.uniform(0.0, 1.0), 4)
        
        features = {
            "elevation": elevation,
            "slope": slope,
            "aspect": aspect,
            "rainfall_24h": rainfall_24h,
            "rainfall_72h": rainfall_72h,
            "rainfall_7d": rainfall_7d,
            "land_cover": land_cover,
            "susceptibility": susceptibility
        }
        
        return AcquiredFeatures(
            grid_code=grid_code,
            features=features,
            susceptibility=SusceptibilityStatus(status="PROVIDED", source="TestFeatureGenerator"),
            complete_for_model=True,
            is_test_data=True,
            lineage=FeatureLineage(
                datasets={
                    "test": DatasetLineage(dataset_id="TestFeatureGenerator", observation_date="deterministic")
                }
            )
        )
