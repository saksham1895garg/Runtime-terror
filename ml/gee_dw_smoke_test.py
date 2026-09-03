import os
import ee
import datetime
import json
from dotenv import load_dotenv
from supabase import create_client
from app.gee.geometry import parse_db_geometry_to_ee

def run_dw_smoke_test():
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
    
    # 3. Load geometry
    res = db.table("analysis_grid_cells").select("geometry").eq("grid_code", grid_code).execute()
    if not res.data or not res.data[0].get("geometry"):
        print(f"Geometry Load: FAILED - {grid_code} not found")
        return
        
    geom_geojson = res.data[0]["geometry"]
    print("Geometry Load: SUCCESS")
    
    # 4. Convert to Earth Engine geometry
    try:
        grid_geom = parse_db_geometry_to_ee(geom_geojson)
        print("Geometry Conversion: SUCCESS")
    except Exception as e:
        print(f"Geometry Conversion: FAILED - {e}")
        return
        
    # 5. Extract Dynamic World
    dataset_id = "GOOGLE/DYNAMICWORLD/V1"
    try:
        now = datetime.datetime.utcnow()
        start = now - datetime.timedelta(days=30)
        start_str = start.strftime('%Y-%m-%d')
        end_str = now.strftime('%Y-%m-%d')
        
        dw_coll = ee.ImageCollection(dataset_id).filterBounds(grid_geom).filterDate(start_str, end_str)
        count = dw_coll.size().getInfo()
        if count == 0:
            print(f"GEE Query: FAILED - No valid dynamic world observations in last 30 days.")
            return
            
        composite = dw_coll.select('label').mode()
        stats = composite.reduceRegion(reducer=ee.Reducer.mode(), geometry=grid_geom, scale=10, maxPixels=1e9).getInfo()
        
        label_id = stats.get('label')
        if label_id is None:
            print("GEE Query: FAILED - Dynamic World returned no data for this geometry")
            return
            
        label_id = int(label_id)
        
        # Map DW IDs to classes
        dw_classes = {
            0: "water",
            1: "trees",
            2: "grass",
            3: "flooded_vegetation",
            4: "crops",
            5: "shrub_and_scrub",
            6: "built",
            7: "bare",
            8: "snow_and_ice"
        }
        
        dominant_class = dw_classes.get(label_id, "unknown")
        
        print("GEE Query: SUCCESS")
    except Exception as e:
        print(f"GEE Query: FAILED - {e}")
        return
        
    # 6. Report Result
    result = {
      "grid_code": grid_code,
      "dataset_id": dataset_id,
      "temporal_start": start_str,
      "temporal_end": end_str,
      "observation_count": count,
      "dominant_class": dominant_class,
      "dominant_class_id": label_id,
      "aggregation": {
          "temporal": "mode (most frequent class over time)",
          "spatial": "mode (most frequent class over spatial grid)"
      },
      "extraction_timestamp": datetime.datetime.utcnow().isoformat() + "Z",
      "status": "success"
    }
    
    print("\n--- EXTRACTION RESULT ---")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    run_dw_smoke_test()
