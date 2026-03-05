"""
Load all ML models at application startup.
"""

import os
import joblib
from typing import Any, Dict


def load_all_models(models: Dict[str, Any], project_root: str) -> None:
    """Populate the shared *models* dict with hemoglobin + YOLO models."""

    # ---- Hemoglobin regression ----
    hb_dir = os.path.join(project_root, "Models", "Hemogoblin")
    model_path = os.path.join(hb_dir, "hb_regression_model.pkl")
    scaler_path = os.path.join(hb_dir, "hb_scaler.pkl")

    if os.path.exists(model_path) and os.path.exists(scaler_path):
        models["hb_model"] = joblib.load(model_path)
        models["hb_scaler"] = joblib.load(scaler_path)
        print("✅ Hemoglobin model & scaler loaded")
    else:
        print(f"⚠️  Hemoglobin model files not found in {hb_dir}")
        print("   Run 'python main.py' inside hemoglobin-prediction/ first.")

    # ---- YOLO urinalysis strip detector ----
    yolo_path = os.path.join(project_root, "Models", "M2_Analysis", "models", "urinalysis_model3_best.pt")
    if os.path.exists(yolo_path):
        try:
            from ultralytics import YOLO
            models["yolo_model"] = YOLO(yolo_path, task="detect")
            print("✅ YOLO urinalysis model loaded")
        except ImportError:
            print("⚠️  ultralytics not installed — YOLO strip detection unavailable")
        except Exception as e:
            print(f"⚠️  Failed to load YOLO model: {e}")
    else:
        print(f"⚠️  YOLO model not found at {yolo_path}")
        print("   Urinalysis will use full-image fallback.")
