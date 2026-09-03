import math
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List
from app.features.schemas import GridFeatures
import datetime

class SusceptibilityStatus(BaseModel):
    status: str
    source: Optional[str] = None

class DatasetLineage(BaseModel):
    dataset_id: str
    observation_date: Optional[str] = None
    temporal_window: Optional[str] = None
    observation_count: Optional[int] = None
    dominant_class_probability: Optional[float] = None

class FeatureLineage(BaseModel):
    extraction_timestamp: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat())
    datasets: Dict[str, DatasetLineage]

class AcquiredFeatures(BaseModel):
    grid_code: str
    features: Dict[str, Any]
    susceptibility: SusceptibilityStatus
    complete_for_model: bool
    is_test_data: bool
    lineage: FeatureLineage

    @field_validator("features")
    def validate_acquired_features(cls, v):
        for key in ["elevation", "slope", "aspect", "rainfall_24h", "rainfall_72h", "rainfall_7d"]:
            if key in v:
                val = v[key]
                if val is None or math.isnan(val) or math.isinf(val):
                    raise ValueError(f"Acquired feature {key} must be a finite number, got {val}")
                if "rainfall" in key and val < 0:
                    raise ValueError(f"Rainfall cannot be negative, got {val}")
        if "slope" in v and not (0 <= v["slope"] <= 90):
            raise ValueError(f"Slope must be 0-90, got {v['slope']}")
        if "aspect" in v and not (0 <= v["aspect"] <= 360):
            raise ValueError(f"Aspect must be 0-360, got {v['aspect']}")
        return v

    def to_grid_features(self) -> GridFeatures:
        if not self.complete_for_model:
            from app.gee.errors import FeatureSetIncompleteError
            raise FeatureSetIncompleteError(
                f"Feature set for {self.grid_code} is incomplete. "
                f"Susceptibility status: {self.susceptibility.status}"
            )
            
        from app.features.schemas import StaticModelFeatures
        model_features_obj = None
        if "mean_elevation_m" in self.features:
            model_features_obj = StaticModelFeatures(
                mean_elevation_m=self.features["mean_elevation_m"],
                min_elevation_m=self.features["min_elevation_m"],
                max_elevation_m=self.features["max_elevation_m"],
                elevation_range_m=self.features["elevation_range_m"],
                std_elevation_m=self.features["std_elevation_m"],
                mean_slope_deg=self.features["mean_slope_deg"],
                min_slope_deg=self.features["min_slope_deg"],
                max_slope_deg=self.features["max_slope_deg"],
                std_slope_deg=self.features["std_slope_deg"],
                p25_slope_deg=self.features["p25_slope_deg"],
                p50_slope_deg=self.features["p50_slope_deg"],
                p75_slope_deg=self.features["p75_slope_deg"],
                p90_slope_deg=self.features["p90_slope_deg"],
                mean_aspect_sin=self.features["mean_aspect_sin"],
                mean_aspect_cos=self.features["mean_aspect_cos"],
            )

        return GridFeatures(
            grid_code=self.grid_code,
            elevation=self.features["elevation"],
            slope=self.features["slope"],
            aspect=self.features["aspect"],
            rainfall_24h=self.features["rainfall_24h"],
            rainfall_72h=self.features["rainfall_72h"],
            rainfall_7d=self.features["rainfall_7d"],
            land_cover=self.features["land_cover"],
            susceptibility=self.features.get("susceptibility", 0.0),
            is_test_data=self.is_test_data,
            model_features=model_features_obj
        )
