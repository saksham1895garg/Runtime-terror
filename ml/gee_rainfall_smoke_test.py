import os
import ee
import datetime
import json
from dotenv import load_dotenv
from supabase import create_client
from app.gee.geometry import parse_db_geometry_to_ee

def run_rainfall_smoke_test():
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
        
    # 5. Extract Rainfall
    dataset_id = "UCSB-CHC/CHIRPS/V3/DAILY_SAT"
    try:
        precip_coll = ee.ImageCollection(dataset_id)
        
        latest_image = precip_coll.limit(1, 'system:time_start', False).first()
        latest_date_ee = ee.Date(latest_image.get('system:time_start'))
        t_0_str = latest_date_ee.format('YYYY-MM-dd').getInfo()
        
        if not t_0_str:
            print("GEE Query: FAILED - CHIRPS collection is empty or unavailable")
            return
            
        t_0 = datetime.datetime.strptime(t_0_str, '%Y-%m-%d')
        
        t_2 = t_0 - datetime.timedelta(days=2)
        t_6 = t_0 - datetime.timedelta(days=6)
        
        p_24h = precip_coll.filterDate(t_0.strftime('%Y-%m-%d'), (t_0 + datetime.timedelta(days=1)).strftime('%Y-%m-%d')).sum()
        p_72h = precip_coll.filterDate(t_2.strftime('%Y-%m-%d'), (t_0 + datetime.timedelta(days=1)).strftime('%Y-%m-%d')).sum()
        p_7d = precip_coll.filterDate(t_6.strftime('%Y-%m-%d'), (t_0 + datetime.timedelta(days=1)).strftime('%Y-%m-%d')).sum()
        
        def get_mean(img):
            stats = img.reduceRegion(reducer=ee.Reducer.mean(), geometry=grid_geom, scale=500, maxPixels=1e9).getInfo()
            val = stats.get('precipitation')
            if val is None:
                raise Exception("CHIRPS returned no data for this geometry")
            return val

        rainfall_24h_mm = get_mean(p_24h)
        rainfall_72h_mm = get_mean(p_72h)
        rainfall_7d_mm = get_mean(p_7d)
        
        print("GEE Query: SUCCESS")
    except Exception as e:
        print(f"GEE Query: FAILED - {e}")
        return
        
    # 6. Report Result
    # Define exact source dates used
    dates = []
    for i in range(7):
        d = t_0 - datetime.timedelta(days=i)
        dates.append(d.strftime('%Y-%m-%d'))
        
    result = {
      "grid_code": grid_code,
      "dataset_id": dataset_id,
      "rainfall_24h_mm": rainfall_24h_mm,
      "rainfall_72h_mm": rainfall_72h_mm,
      "rainfall_7d_mm": rainfall_7d_mm,
      "observation_dates": {
          "24h_date": dates[0],
          "72h_dates": dates[0:3],
          "7d_dates": dates
      },
      "aggregation": {
          "daily_definition": "completed daily accumulation",
          "timezone": "UTC",
          "spatial_reduction": "mean"
      },
      "extraction_timestamp": datetime.datetime.utcnow().isoformat() + "Z",
      "status": "success"
    }
    
    print("\n--- EXTRACTION RESULT ---")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    run_rainfall_smoke_test()
