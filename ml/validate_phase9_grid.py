import os
import json
from supabase import create_client, Client
from app.gee.features import GEEFeatureProvider
from app.gee.errors import FeatureSetIncompleteError
from app.core.config import settings

db_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def validate_gng_000026():
    print("Initializing GEEFeatureProvider...")
    provider = GEEFeatureProvider()
    
    print("\nAcquiring real features for GNG-000026 from GEE...")
    acquired = provider.acquire("GNG-000026", db_client)
    
    print("\nAcquired Features Object:")
    print(acquired.model_dump_json(indent=2))
    
    assert acquired.complete_for_model is False, "complete_for_model should be False because susceptibility is UNRESOLVED"
    print("\n[SUCCESS] complete_for_model correctly marked as False.")
    
    print("\nAttempting to map to GridFeatures (should fail)...")
    try:
        grid_features = acquired.to_grid_features()
        print("Wait, it succeeded? This is an error!")
    except FeatureSetIncompleteError as e:
        print(f"[SUCCESS] Blocked from creating complete model features: {e}")

if __name__ == "__main__":
    validate_gng_000026()
