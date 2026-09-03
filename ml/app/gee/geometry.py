import json
from app.gee.errors import GEEExtractionError

def clean_geojson_coordinates(geom_geojson: dict) -> dict:
    """
    Cleans a GeoJSON dictionary by stripping out 3D (Z) coordinates, 
    ensuring Earth Engine compatibility.
    """
    if geom_geojson.get("type") in ["Polygon", "MultiPolygon"]:
        def remove_z(coords):
            if isinstance(coords[0], (int, float)):
                return coords[:2]
            return [remove_z(c) for c in coords]
            
        geom_geojson["coordinates"] = remove_z(geom_geojson["coordinates"])
        
    return geom_geojson

def parse_db_geometry_to_ee(geom_data) -> "ee.Geometry":
    """
    Parses a geometry (from Supabase JSONB) into a valid ee.Geometry object.
    """
    import ee
    try:
        if isinstance(geom_data, str):
            geom_data = json.loads(geom_data)
            
        cleaned_geojson = clean_geojson_coordinates(geom_data)
        return ee.Geometry(cleaned_geojson)
    except Exception as e:
        raise GEEExtractionError(f"Failed to parse and clean geometry: {e}")
