import datetime
from typing import Dict, Any
from app.gee.schemas import AcquiredFeatures, SusceptibilityStatus, FeatureLineage, DatasetLineage
from app.gee.client import initialize_gee
from app.gee.collections import TERRAIN_DATASET, RAINFALL_DATASET, LAND_COVER_DATASET
from app.gee.errors import GEEExtractionError
import logging

logger = logging.getLogger(__name__)

class GEEFeatureProvider:
    def __init__(self):
        initialize_gee()
        
    def acquire(self, grid_code: str, db_client) -> AcquiredFeatures:
        import ee
        
        # 1. Resolve geometry
        res = db_client.table("analysis_grid_cells").select("geometry").eq("grid_code", grid_code).execute()
        if not res.data or not res.data[0].get("geometry"):
            raise GEEExtractionError(f"Grid code {grid_code} not found or missing geometry")
            
        geom_geojson = res.data[0]["geometry"]
        try:
            from app.gee.geometry import parse_db_geometry_to_ee
            grid_geom = parse_db_geometry_to_ee(geom_geojson)
        except Exception as e:
            raise GEEExtractionError(f"Failed to parse geometry for {grid_code}: {e}")

        now = datetime.datetime.utcnow()
        dataset_lineage = {}
        features = {}
        
        # 2. Extract Terrain
        try:
            dem = ee.Image(TERRAIN_DATASET)
            terrain = ee.Terrain.products(dem)
            terrain_stats = terrain.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=grid_geom,
                scale=30,
                maxPixels=1e9
            ).getInfo()
            
            features["elevation"] = terrain_stats.get("elevation")
            features["slope"] = terrain_stats.get("slope")
            features["aspect"] = terrain_stats.get("aspect")
            
            dataset_lineage["terrain"] = DatasetLineage(
                dataset_id=TERRAIN_DATASET
            )
        except Exception as e:
            logger.error(f"Failed to extract terrain for {grid_code}: {e}")
            raise GEEExtractionError(f"Failed to extract terrain: {e}")

        # 3. Extract Rainfall (CHIRPS)
        try:
            precip_coll = ee.ImageCollection(RAINFALL_DATASET)
            latest_image = precip_coll.limit(1, 'system:time_start', False).first()
            latest_date_ee = ee.Date(latest_image.get('system:time_start'))
            
            t_0_str = latest_date_ee.format('YYYY-MM-dd').getInfo()
            if not t_0_str:
                raise GEEExtractionError("CHIRPS collection is empty or unavailable")
                
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
                    raise GEEExtractionError("CHIRPS returned no data for this geometry")
                return float(val)

            features["rainfall_24h"] = get_mean(p_24h)
            features["rainfall_72h"] = get_mean(p_72h)
            features["rainfall_7d"] = get_mean(p_7d)
            
            dataset_lineage["rainfall"] = DatasetLineage(
                dataset_id=RAINFALL_DATASET,
                observation_date=t_0_str,
                temporal_window="latest_available"
            )
        except Exception as e:
            logger.error(f"Failed to extract rainfall for {grid_code}: {e}")
            raise GEEExtractionError(f"Failed to extract rainfall: {e}")
            
        # 4. Extract Land Cover (Dynamic World)
        try:
            start = now - datetime.timedelta(days=30)
            start_str = start.strftime('%Y-%m-%d')
            end_str = now.strftime('%Y-%m-%d')
            
            dw_coll = ee.ImageCollection(LAND_COVER_DATASET).filterBounds(grid_geom).filterDate(start_str, end_str)
            count = dw_coll.size().getInfo()
            if count == 0:
                raise GEEExtractionError("No Dynamic World observations found in the past 30 days")
                
            # Mode of labels
            composite_label = dw_coll.select('label').mode()
            stats_label = composite_label.reduceRegion(reducer=ee.Reducer.mode(), geometry=grid_geom, scale=10, maxPixels=1e9).getInfo()
            
            # Mean of probabilities to represent confidence/probability of the dominant class
            composite_prob = dw_coll.select([0,1,2,3,4,5,6,7,8]).mean()
            stats_prob = composite_prob.reduceRegion(reducer=ee.Reducer.mean(), geometry=grid_geom, scale=10, maxPixels=1e9).getInfo()
            
            label_id = stats_label.get('label')
            if label_id is None:
                raise GEEExtractionError("Dynamic World returned no data for this geometry")
                
            label_id = int(label_id)
            
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
            class_name = dw_classes.get(label_id, "unknown")
            features["land_cover"] = class_name
            
            prob_key = class_name
            if prob_key == 'shrub_and_scrub':
                prob_key = 'shrub_and_scrub' 
            # In DW, the bands match the class names exactly
            
            prob_val = stats_prob.get(class_name)
            
            dataset_lineage["land_cover"] = DatasetLineage(
                dataset_id=LAND_COVER_DATASET,
                temporal_window=f"{start_str}_to_{end_str}",
                observation_count=count,
                dominant_class_probability=float(prob_val) if prob_val is not None else None
            )
            
        except Exception as e:
            logger.error(f"Failed to extract land cover for {grid_code}: {e}")
            raise GEEExtractionError(f"Failed to extract land cover: {e}")
            
        # Instead of explicitly 0-filling missing values silently, we allow AcquiredFeatures Pydantic to validate
        # It will throw ValueError for missing/inf/nan according to Phase 9 directives.

        return AcquiredFeatures(
            grid_code=grid_code,
            features=features,
            susceptibility=SusceptibilityStatus(status="UNRESOLVED", source=None),
            complete_for_model=False,
            is_test_data=False,
            lineage=FeatureLineage(
                extraction_timestamp=now.isoformat(),
                datasets=dataset_lineage
            )
        )
