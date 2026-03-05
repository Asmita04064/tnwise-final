"""
/api/hemoglobin — Predict hemoglobin from a blood sample image.

Accepts a base64-encoded image (data-URI or raw base64) and returns:
  - predicted Hb value (g/dL)
  - anemia risk label
  - extracted LAB features
"""

import base64
import io
import numpy as np
import cv2
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app_state import models

# database for recording results
from database import SessionLocal
from models_db import ScreeningRecord

router = APIRouter(tags=["Hemoglobin"])


# ── request / response schemas ──────────────────────────────────
class HbPredictRequest(BaseModel):
    image: str  # base64-encoded image (may include data:image/…;base64, prefix)
    name: str
    age: Optional[int] = None
    name: str
    age: Optional[int] = None


class HbPredictResponse(BaseModel):
    hb_value: float
    hb_interpretation: str
    risk_label: str
    lab_features: dict
    confidence: float


# ── helpers (ported from predict.py) ────────────────────────────
def _decode_image(b64: str) -> np.ndarray:
    """Decode a base64 string (with optional data-URI prefix) to a cv2 image."""
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    raw = base64.b64decode(b64)
    arr = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return img


def _extract_circle_lab(img: np.ndarray) -> Optional[np.ndarray]:
    """Extract mean LAB values from the circular blood region."""
    img = cv2.resize(img, (300, 300))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    circles = cv2.HoughCircles(
        gray, cv2.HOUGH_GRADIENT,
        dp=1, minDist=100,
        param1=50, param2=30,
        minRadius=50, maxRadius=150,
    )

    mask = np.zeros(img.shape[:2], dtype=np.uint8)
    if circles is not None:
        x, y, r = circles[0][0]
        cv2.circle(mask, (int(x), int(y)), int(r), 255, -1)
    else:
        h, w = img.shape[:2]
        center = (w // 2, h // 2)
        radius = min(center[0], center[1]) - 20
        cv2.circle(mask, center, radius, 255, -1)

    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    L, A, B = cv2.split(lab)
    L = cv2.equalizeHist(L)
    lab = cv2.merge([L, A, B])

    masked = lab[mask == 255]
    if len(masked) == 0:
        return None
    return np.mean(masked, axis=0)


def _anemia_interpretation(hb: float) -> tuple[str, str]:
    """Return (interpretation, risk_label) for a given Hb value."""
    if hb >= 12:
        return "Normal", "Normal"
    elif hb >= 10:
        return "Mild Anemia", "Mild Anemia Risk"
    elif hb >= 8:
        return "Moderate Anemia", "Moderate Anemia Risk"
    else:
        return "Severe Anemia", "Severe Anemia Risk"


# ── endpoint ────────────────────────────────────────────────────
@router.post("/hemoglobin/predict", response_model=HbPredictResponse)
async def predict_hemoglobin(req: HbPredictRequest):
    model = models.get("hb_model")
    scaler = models.get("hb_scaler")
    if model is None or scaler is None:
        raise HTTPException(
            status_code=503,
            detail="Hemoglobin model not loaded. Train it first with hemoglobin-prediction/main.py",
        )

    try:
        img = _decode_image(req.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    features = _extract_circle_lab(img)
    if features is None:
        raise HTTPException(status_code=422, detail="Could not extract features from image")

    features_scaled = scaler.transform([features])
    prediction = float(model.predict(features_scaled)[0])
    interpretation, risk = _anemia_interpretation(prediction)

    # record into local database
    try:
        db = SessionLocal()
        record = ScreeningRecord(
            patient_name=req.name,
            age=req.age or 0,
            screening_type="hemoglobin",
            result_value=prediction,
            risk=risk,
            synced=False,
        )
        db.add(record)
        db.commit()
    finally:
        db.close()

    return HbPredictResponse(
        hb_value=round(prediction, 2),
        hb_interpretation=interpretation,
        risk_label=risk,
        lab_features={
            "L": round(float(features[0]), 2),
            "A": round(float(features[1]), 2),
            "B": round(float(features[2]), 2),
        },
        confidence=round(min(99.0, max(60.0, 95 - abs(prediction - 12) * 3)), 1),
    )
