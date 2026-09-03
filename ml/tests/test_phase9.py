import pytest
from app.features.schemas import GridFeatures
from app.gee.schemas import AcquiredFeatures, SusceptibilityStatus, FeatureLineage, DatasetLineage
from app.model.predictor import RealModelPredictor, ModelArtifactNotFoundError
from app.gee.errors import FeatureSetIncompleteError
import math

def test_grid_features_validation():
    # Test valid
    features = GridFeatures(
        grid_code="G1",
        elevation=100.0,
        slope=45.0,
        aspect=180.0,
        rainfall_24h=10.0,
        rainfall_72h=30.0,
        rainfall_7d=100.0,
        land_cover="trees",
        susceptibility=0.5
    )
    assert features.slope == 45.0

    # Test invalid slope
    with pytest.raises(ValueError, match="Slope must be between 0 and 90"):
        GridFeatures(
            grid_code="G1", elevation=100.0, slope=100.0, aspect=180.0,
            rainfall_24h=10.0, rainfall_72h=30.0, rainfall_7d=100.0,
            land_cover="trees", susceptibility=0.5
        )

    # Test negative rainfall
    with pytest.raises(ValueError, match="cannot be negative"):
        GridFeatures(
            grid_code="G1", elevation=100.0, slope=45.0, aspect=180.0,
            rainfall_24h=-5.0, rainfall_72h=30.0, rainfall_7d=100.0,
            land_cover="trees", susceptibility=0.5
        )

    # Test invalid aspect
    with pytest.raises(ValueError, match="Aspect must be between 0 and 360"):
        GridFeatures(
            grid_code="G1", elevation=100.0, slope=45.0, aspect=400.0,
            rainfall_24h=10.0, rainfall_72h=30.0, rainfall_7d=100.0,
            land_cover="trees", susceptibility=0.5
        )

def test_acquired_features_validation():
    # Valid
    acq = AcquiredFeatures(
        grid_code="G1",
        features={
            "elevation": 100.0,
            "slope": 45.0,
            "aspect": 180.0,
            "rainfall_24h": 10.0,
            "rainfall_72h": 30.0,
            "rainfall_7d": 100.0,
            "land_cover": "trees"
        },
        susceptibility=SusceptibilityStatus(status="UNRESOLVED"),
        complete_for_model=False,
        is_test_data=False,
        lineage=FeatureLineage(datasets={"test": DatasetLineage(dataset_id="test")})
    )
    
    # Incomplete conversion
    with pytest.raises(FeatureSetIncompleteError):
        acq.to_grid_features()
        
    # Test invalid AcquiredFeature (NaN)
    with pytest.raises(ValueError, match="must be a finite number"):
        AcquiredFeatures(
            grid_code="G1",
            features={
                "elevation": float('nan'),
                "slope": 45.0,
                "aspect": 180.0,
                "rainfall_24h": 10.0,
                "rainfall_72h": 30.0,
                "rainfall_7d": 100.0,
                "land_cover": "trees"
            },
            susceptibility=SusceptibilityStatus(status="UNRESOLVED"),
            complete_for_model=False,
            is_test_data=False,
            lineage=FeatureLineage(datasets={"test": DatasetLineage(dataset_id="test")})
        )

def test_real_model_predictor_missing_artifact():
    with pytest.raises(ModelArtifactNotFoundError, match="Cannot initialize PRODUCTION backend"):
        RealModelPredictor(model_path="/fake/path/model.pkl", model_name="fake", model_version="1")
