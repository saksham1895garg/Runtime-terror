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
    mock_terrain.reduceRegion.return_value.getInfo.return_value = {
        "elevation": 1500.0,
        "slope": 10.5,
        "aspect": 180.0
    }
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
    
    mock_ee.Reducer.mean.return_value = "mean_reducer"
    mock_ee.Reducer.mode.return_value = "mode_reducer"

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
