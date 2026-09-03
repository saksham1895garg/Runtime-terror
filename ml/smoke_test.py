import json
import os
import joblib
import pandas as pd
import numpy as np

def run_smoke_test():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(base_dir, "models", "static_model_v1")
    
    # 1. Read feature_list.json
    feature_list_path = os.path.join(model_dir, "feature_list.json")
    with open(feature_list_path, "r") as f:
        feature_data = json.load(f)
    
    features = feature_data["primary_15"]
    print("1. Feature names loaded:")
    for i, f in enumerate(features, 1):
        print(f"   {i}. {f}")
        
    # 2. Construct one input row with all 15 features
    # Realistic values for Sikkim (elevation ~1500m, slope ~30deg)
    test_values = {
        "mean_elevation_m": 1500.0,
        "min_elevation_m": 1400.0,
        "max_elevation_m": 1600.0,
        "elevation_range_m": 200.0,
        "std_elevation_m": 50.0,
        "mean_slope_deg": 30.0,
        "min_slope_deg": 5.0,
        "max_slope_deg": 65.0,
        "std_slope_deg": 10.0,
        "p25_slope_deg": 20.0,
        "p50_slope_deg": 30.0,
        "p75_slope_deg": 40.0,
        "p90_slope_deg": 50.0,
        "mean_aspect_sin": 0.5,
        "mean_aspect_cos": 0.5
    }
    
    # 3. Create DataFrame
    df = pd.DataFrame([test_values], columns=features)
    print("\n2. Input DataFrame constructed.")
    print(f"   Input shape: {df.shape}")
    
    # 4. Load artifact
    model_path = os.path.join(model_dir, "gangtok_static_logreg_A2_sigmoid_v1.joblib")
    print(f"\n3. Loading model from {model_path}...")
    model = joblib.load(model_path)
    
    # 5. Pass DataFrame and predict
    print("\n4. Running predict_proba()...")
    probs = model.predict_proba(df)
    
    prob_0 = probs[0, 0]
    prob_1 = probs[0, 1]
    
    print("\n=== SMOKE TEST RESULTS ===")
    print(f"Class 0 (Negative) Probability: {prob_0:.6f}")
    print(f"Class 1 (Positive) Probability: {prob_1:.6f}")
    
    total = prob_0 + prob_1
    print(f"Sum of probabilities: {total:.6f}")
    
    if np.isclose(total, 1.0):
        print("\nSUCCESS: Probabilities sum to approximately 1.0")
    else:
        print("\nWARNING: Probabilities do NOT sum to 1.0")

if __name__ == "__main__":
    run_smoke_test()
