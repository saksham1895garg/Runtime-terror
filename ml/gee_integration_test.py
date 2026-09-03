import os
import ee
import datetime
import json
from dotenv import load_dotenv
from supabase import create_client

from app.gee.features import GEEFeatureProvider

def run_integration_test():
    load_dotenv()
    
    # 1. Initialize Earth Engine
    try:
        ee.Initialize(project="unisaa")
        print("GEE Initialization: SUCCESS")
    except Exception as e:
        print(f"GEE Initialization: FAILED - {e}")
        return

    # 2. Connect to Supabase
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        print("Supabase Config: FAILED - Missing URL or KEY")
        return
        
    db = create_client(supabase_url, supabase_key)
    grid_code = "GNG-000026"
    
    # 3. Use the GEEFeatureProvider
    try:
        provider = GEEFeatureProvider()
        acquired = provider.acquire(grid_code, db)
        
        # 4. Format the output to exactly match user's expected conceptual output
        lineage = acquired.lineage.copy()
        
        rainfall_source = lineage.get("sources", {}).get("rainfall", {})
        lc_source = lineage.get("sources", {}).get("land_cover", {})
        
        output = {
          "grid_code": grid_code,
          "terrain": {
            "elevation_m": acquired.features.get("elevation"),
            "slope_degrees": acquired.features.get("slope"),
            "aspect_degrees": acquired.features.get("aspect")
          },
          "rainfall": {
            "rainfall_24h_mm": acquired.features.get("rainfall_24h"),
            "rainfall_72h_mm": acquired.features.get("rainfall_72h"),
            "rainfall_7d_mm": acquired.features.get("rainfall_7d"),
            "dataset_id": rainfall_source.get("dataset"),
            "latest_observation_date": rainfall_source.get("latest_observation_date")
          },
          "land_cover": {
            "dataset_id": lc_source.get("dataset"),
            "dominant_class": acquired.features.get("land_cover"),
            "dominant_class_id": lc_source.get("dominant_class_id"),
            "observation_count": lc_source.get("observation_count"),
            "temporal_start": lc_source.get("temporal_start"),
            "temporal_end": lc_source.get("temporal_end")
          },
          "susceptibility": {
            "status": acquired.susceptibility.status,
            "source": acquired.susceptibility.source
          },
          "complete_for_model": acquired.complete_for_model,
          "is_test_data": acquired.is_test_data,
          "lineage": lineage
        }
        
        print("\n--- EXTRACTION RESULT ---")
        print(json.dumps(output, indent=2))
        print("\nIntegration Test: SUCCESS")
        
    except Exception as e:
        print(f"Integration Test: FAILED - {e}")
        return
        
if __name__ == "__main__":
    run_integration_test()
