from unittest.mock import MagicMock, patch
import pytest
from app.gee.features import GEEFeatureProvider
from app.gee.schemas import AcquiredFeatures
from app.gee.errors import FeatureSetIncompleteError

def test_gee_feature_provider_acquire(monkeypatch):
    # Mock ee module
    mock_ee = MagicMock()
    
    # Mock Geometry
    mock_ee.Geometry.return_value = "MOCKED_GEOMETRY"
    
    # Mock Image / Terrain
    mock_dem = MagicMock()
    mock_ee.Image.return_value = mock_dem
    mock_terrain = MagicMock()
    mock_selected = MagicMock()
    mock_selected.reduceRegion.return_value.getInfo.return_value = {
        "elevation_mean": 1500.0,
        "elevation_min": 1400.0,
        "elevation_max": 1600.0,
        "elevation_stdDev": 10.0,
        "slope_mean": 10.5,
        "slope_min": 5.0,
        "slope_max": 15.0,
        "slope_stdDev": 2.0,
        "slope_p25": 8.0,
        "slope_p50": 10.0,
        "slope_p75": 12.0,
        "slope_p90": 14.0,
        "aspect": 180.0,
        "aspect_sin": 0.0,
        "aspect_cos": -1.0
    }
    mock_terrain.select.return_value = mock_selected
    
    mock_aspect_rad = MagicMock()
    mock_terrain.select.return_value.multiply.return_value = mock_aspect_rad
    mock_aspect_rad.sin.return_value.rename.return_value = mock_selected
    mock_aspect_rad.cos.return_value.rename.return_value = mock_selected
    mock_ee.Terrain.products.return_value = mock_terrain
    
    # Mock ImageCollection (Rainfall and Land Cover)
    mock_img_col = MagicMock()
    mock_first_image = MagicMock()
    mock_first_image.get.return_value = 1690000000000
    mock_img_col.limit.return_value.first.return_value = mock_first_image
    
    mock_ee.Date.return_value.format.return_value.getInfo.return_value = "2026-07-31"
    
    mock_img_col.filterDate.return_value.sum.return_value.reduceRegion.return_value.getInfo.return_value = {
        "precipitation": 12.5
    }
    # For land cover
    mock_img_col.size.return_value.getInfo.return_value = 5
    mock_img_col.filterBounds.return_value.filterDate.return_value.size.return_value.getInfo.return_value = 5
    mock_img_col.filterBounds.return_value.filterDate.return_value.select.return_value.mode.return_value.reduceRegion.return_value.getInfo.return_value = {
        "label": 1
    }
    mock_ee.ImageCollection.return_value = mock_img_col
    
    mock_mean_reducer = MagicMock()
    mock_mean_reducer.combine.return_value.combine.return_value = mock_mean_reducer
    mock_ee.Reducer.mean.return_value = mock_mean_reducer
    mock_ee.Reducer.mode.return_value = MagicMock()
    mock_ee.Reducer.minMax.return_value = MagicMock()
    mock_ee.Reducer.stdDev.return_value = MagicMock()
    mock_ee.Reducer.percentile.return_value = MagicMock()

    # Inject mock into sys.modules
    import sys
    sys.modules['ee'] = mock_ee
    
    # Mock settings to enable GEE
    from app.core.config import settings
    monkeypatch.setattr(settings, "GEE_ENABLED", True)
    
    # Mock db client
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"geometry": {"type": "Polygon", "coordinates": [[[0, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 0]]]}}]
    )
    
    provider = GEEFeatureProvider()
    
    acquired = provider.acquire("GNG-000026", mock_db)
    
    assert isinstance(acquired, AcquiredFeatures)
    assert acquired.grid_code == "GNG-000026"
    assert acquired.features["elevation"] == 1500.0
    assert acquired.features["rainfall_24h"] == 12.5
    assert acquired.features["land_cover"] == "trees" # 1 = trees
    assert acquired.susceptibility.status == "UNRESOLVED"
    assert acquired.complete_for_model is False
    assert acquired.is_test_data is False
    
    # Should throw FeatureSetIncompleteError when converting
    with pytest.raises(FeatureSetIncompleteError):
        acquired.to_grid_features()
