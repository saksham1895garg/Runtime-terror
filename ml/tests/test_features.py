import pytest
from app.features.schemas import GridFeatures
from app.features.test_generator import TestFeatureGenerator

def test_feature_schema_validation():
    # Valid data
    data = {
        "grid_code": "GNG-000026",
        "elevation": 1500.5,
        "slope": 45.0,
        "aspect": 180.0,
        "rainfall_24h": 10.0,
        "rainfall_72h": 20.0,
        "rainfall_7d": 50.0,
        "land_cover": "Forest",
        "susceptibility": 0.5,
        "is_test_data": True
    }
    features = GridFeatures(**data)
    assert features.grid_code == "GNG-000026"
    assert features.is_test_data is True

def test_generator_deterministic():
    generator = TestFeatureGenerator()
    feat1 = generator.acquire("GNG-000026").to_grid_features()
    feat2 = generator.acquire("GNG-000026").to_grid_features()
    
    assert feat1.elevation == feat2.elevation
    assert feat1.rainfall_24h == feat2.rainfall_24h

def test_generator_different_grids():
    generator = TestFeatureGenerator()
    feat1 = generator.acquire("GNG-000026").to_grid_features()
    feat2 = generator.acquire("GNG-000027").to_grid_features()
    
    # Very high probability they are different
    assert feat1.elevation != feat2.elevation

def test_generator_is_test_data():
    generator = TestFeatureGenerator()
    feat = generator.acquire("GNG-000026").to_grid_features()
    assert feat.is_test_data is True
