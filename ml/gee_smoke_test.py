import os
import ee
import datetime
import json
from dotenv import load_dotenv
from supabase import create_client

def run_smoke_test():
    load_dotenv()
    
    # 1. Initialize Earth Engine (reusing the user's successful method)
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
    
    # 3. Load geometry
    res = db.table("analysis_grid_cells").select("geometry").eq("grid_code", grid_code).execute()
    if not res.data or not res.data[0].get("geometry"):
        print(f"Geometry Load: FAILED - {grid_code} not found")
        return
        
    geom_geojson = res.data[0]["geometry"]
    print("Geometry Load: SUCCESS")
    
    # 4. Convert to Earth Engine geometry
    try:
        from app.gee.geometry import parse_db_geometry_to_ee
        grid_geom = parse_db_geometry_to_ee(geom_geojson)
        print("Geometry Conversion: SUCCESS")
    except Exception as e:
        print(f"Geometry Conversion: FAILED - {e}")
        return
        
    # 5. Extract Terrain
    dataset_id = "NASA/NASADEM_HGT/001"
    try:
        dem = ee.Image(dataset_id)
        terrain = ee.Terrain.products(dem)
        stats = terrain.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=grid_geom,
            scale=30,
            maxPixels=1e9
        ).getInfo()
        
        elevation = stats.get('elevation')
        slope = stats.get('slope')
        aspect = stats.get('aspect')
        print("GEE Query: SUCCESS")
    except Exception as e:
        print(f"GEE Query: FAILED - {e}")
        return
        
    # 6. Report Result
    result = {
        "grid_code": grid_code,
        "elevation_m": elevation,
        "slope_degrees": slope,
        "aspect_degrees": aspect,
        "dataset_id": dataset_id,
        "status": "success"
    }
    
    print("\n--- EXTRACTION RESULT ---")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    run_smoke_test()
