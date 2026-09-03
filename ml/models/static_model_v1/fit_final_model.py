"""Final deployment fit (Sections 18-19).

Base pipeline (imputer + scaler + LogisticRegression C=10, class_weight=
balanced) fit on ALL 2,584 A2 rows / 75 positives. Deployment calibrator:
CalibratedClassifierCV(cv=inner_StratifiedKFold, ensemble=False) fit on the
same full deployment-training set -- internally generates whole-dataset
out-of-fold raw scores via the inner CV to fit the sigmoid calibrator, then
separately refits the base pipeline on all deployment-training data. This
single fitted CalibratedClassifierCV IS the packaged
"full-data base pipeline + OOF-trained calibrator" artifact.

Run with: .venv/Scripts/python.exe -m src.models.fit_final_model
"""
from __future__ import annotations

import json
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import sklearn
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold

from src.calibration.nested_calibration import INNER_N_SPLITS, base_pipeline_factory
from src.data.loader import EXPECTED_MASTER_SHA256, load_master
from src.evaluation.threshold_analysis import ROOT
from src.features.allowlist import build_arm, get_feature_lists
from src.models.baseline import SEED

MODEL_DIR = ROOT / "outputs" / "static_model_v1" / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

ARM = "A2"
C = 10
CLASS_WEIGHT = "balanced"
CALIBRATION_METHOD = "sigmoid"
MODEL_VERSION = "gangtok_static_logreg_A2_sigmoid_v1"


def main():
    df = load_master()
    X, y, ids = build_arm(df, ARM)
    primary, area, banned = get_feature_lists()

    inner_cv = StratifiedKFold(n_splits=INNER_N_SPLITS, shuffle=True, random_state=SEED)
    base = base_pipeline_factory(ARM, C=C, class_weight=CLASS_WEIGHT)()
    calibrated = CalibratedClassifierCV(estimator=base, method=CALIBRATION_METHOD, cv=inner_cv, ensemble=False)
    calibrated.fit(X, y)

    model_path = MODEL_DIR / f"{MODEL_VERSION}.joblib"
    joblib.dump(calibrated, model_path)

    # reload check (Hard Stop K): saved model must reproduce its own frozen predictions
    reloaded = joblib.load(model_path)
    p1 = calibrated.predict_proba(X)[:, 1]
    p2 = reloaded.predict_proba(X)[:, 1]
    import numpy as np
    max_diff = float(np.max(np.abs(p1 - p2)))
    if max_diff > 1e-12:
        raise RuntimeError(f"HARD STOP K: reloaded model predictions differ from original by {max_diff}")
    print(f"Reload check OK: max prediction difference after reload = {max_diff}")

    # base (uncalibrated) pipeline, refit identically on all data, for the raw ranking score
    base_full = base_pipeline_factory(ARM, C=C, class_weight=CLASS_WEIGHT)()
    base_full.fit(X, y)
    raw_score_all = base_full.predict_proba(X)[:, 1]

    metadata = {
        "model_version": MODEL_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "architecture": {
            "family": "LogisticRegression", "arm": ARM, "C": C, "class_weight": CLASS_WEIGHT,
            "penalty": "l2", "max_iter": 2000, "random_state": SEED,
            "preprocessing": ["SimpleImputer(strategy=median)", "StandardScaler"],
            "feature_list": primary,
        },
        "calibration": {
            "method": CALIBRATION_METHOD, "inner_cv": f"StratifiedKFold(n_splits={INNER_N_SPLITS}, shuffle=True, random_state={SEED})",
            "ensemble": False,
            "note": "Calibrator fit on whole-dataset inner-CV out-of-fold raw scores; base pipeline separately refit on all deployment-training data (this file).",
        },
        "training_data": {
            "rows": len(X), "positives": int(y.sum()), "negatives": int((y == 0).sum()),
            "dataset_sha256": EXPECTED_MASTER_SHA256,
        },
        "environment": {"python_version": sys.version, "sklearn_version": sklearn.__version__, "platform": platform.platform()},
        "model_file": str(model_path.relative_to(ROOT)),
    }
    with open(MODEL_DIR / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    with open(MODEL_DIR / "feature_list.json", "w", encoding="utf-8") as f:
        json.dump({"primary_15": primary, "area_sensitivity_16_not_used_in_final_model": area, "hard_banned": banned}, f, indent=2)

    print(f"Final model saved: {model_path}")
    print(f"Training rows={len(X)} positives={int(y.sum())}")
    print(f"Calibrated proba range: [{p1.min():.4f}, {p1.max():.4f}]")
    print(f"Raw score range: [{raw_score_all.min():.4f}, {raw_score_all.max():.4f}]")


if __name__ == "__main__":
    main()
