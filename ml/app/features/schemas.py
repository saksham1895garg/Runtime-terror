import math
from pydantic import BaseModel, Field, field_validator
from typing import Optional

class GridFeatures(BaseModel):
    """
    Current application feature contract for the TestPredictor.
    NOTE: The future trained-model feature contract may differ when the real model arrives.
    Do not assume this is the final predictive contract for the production model.
    """
    grid_code: str = Field(..., description="The unique grid cell identifier")
    elevation: float = Field(..., description="Elevation in meters (NASADEM_HGT)")
    slope: float = Field(..., description="Slope in degrees (0 to 90)")
    aspect: float = Field(..., description="Aspect in degrees (0 to 360)")
    rainfall_24h: float = Field(..., description="Rainfall in the latest 24 hours completed (mm)")
    rainfall_72h: float = Field(..., description="Rainfall in the latest 72 hours completed (mm)")
    rainfall_7d: float = Field(..., description="Rainfall in the latest 7 days completed (mm)")
    land_cover: str = Field(..., description="Dominant land cover classification (Dynamic World)")
    susceptibility: float = Field(..., description="Static landslide susceptibility index. Currently UNRESOLVED in real-data; TestPredictor uses dummy values.")
    is_test_data: bool = Field(True, description="Flag indicating if this is test data")
    model_features: Optional['StaticModelFeatures'] = Field(None, description="The 15 exact features required by the real ML model")

    @field_validator("elevation", "slope", "aspect", "rainfall_24h", "rainfall_72h", "rainfall_7d", "susceptibility")
    def reject_nan_and_inf(cls, v, info):
        if math.isnan(v) or math.isinf(v):
            raise ValueError(f"{info.field_name} must be a valid finite number, got {v}")
        return v

    @field_validator("slope")
    def validate_slope(cls, v):
        if v < 0 or v > 90:
            raise ValueError(f"Slope must be between 0 and 90 degrees, got {v}")
        return v

    @field_validator("aspect")
    def validate_aspect(cls, v):
        if v < 0 or v > 360:
            raise ValueError(f"Aspect must be between 0 and 360 degrees, got {v}")
        return v

    @field_validator("rainfall_24h", "rainfall_72h", "rainfall_7d")
    def validate_rainfall(cls, v, info):
        if v < 0:
            raise ValueError(f"{info.field_name} cannot be negative, got {v}")
        return v

    @field_validator("land_cover")
    def validate_land_cover(cls, v):
        if not v or v.strip() == "":
            raise ValueError("Land cover classification cannot be empty")
        return v

class StaticModelFeatures(BaseModel):
    mean_elevation_m: float
    min_elevation_m: float
    max_elevation_m: float
    elevation_range_m: float
    std_elevation_m: float
    mean_slope_deg: float
    min_slope_deg: float
    max_slope_deg: float
    std_slope_deg: float
    p25_slope_deg: float
    p50_slope_deg: float
    p75_slope_deg: float
    p90_slope_deg: float
    mean_aspect_sin: float
    mean_aspect_cos: float

    @field_validator("*")
    def reject_nan_and_inf(cls, v, info):
        if math.isnan(v) or math.isinf(v):
            raise ValueError(f"{info.field_name} must be a valid finite number, got {v}")
        return v

