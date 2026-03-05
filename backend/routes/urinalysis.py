"""
/api/urinalysis — Analyze a urine test strip image.

Accepts a base64-encoded image and returns:
  - 10 urinalysis parameters (Roche LAB color-matched)
  - disease predictions
  - clinical risk level
"""

import base64
import numpy as np
import cv2
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app_state import models

# database imports
from database import SessionLocal
from models_db import ScreeningRecord

router = APIRouter(tags=["Urinalysis"])

# ── constants (from urinalysis.py) ──────────────────────────────
NUM_PADS = 11
PAD_NAMES = [
    "Specific Gravity", "pH", "Leukocytes", "Nitrite", "Protein",
    "Glucose", "Ketone", "Urobilinogen", "Bilirubin", "Erythrocytes", "Color",
]

ROCHE_CHART = {
    "Leukocytes":   [("neg", (88, 0, 6)), ("trace", (82, -2, 8)), ("1+", (76, -4, 10)), ("2+", (70, -6, 12))],
    "Protein":      [("neg", (90, -2, 8)), ("trace", (84, -4, 12)), ("1+", (78, -6, 16)), ("2+", (70, -8, 20))],
    "Glucose":      [("neg", (90, -4, 10)), ("1+", (82, -6, 14)), ("2+", (74, -8, 18)), ("3+", (66, -10, 22)), ("4+", (58, -12, 26))],
    "Ketone":       [("neg", (92, -2, 6)), ("1+", (82, 8, -6)), ("2+", (70, 16, -12)), ("3+", (60, 22, -18))],
    "Urobilinogen": [("normal", (92, -2, 6)), ("1+", (80, 6, -4)), ("2+", (66, 14, -10)), ("3+", (56, 20, -14))],
    "Bilirubin":    [("neg", (94, -2, 6)), ("1+", (82, 10, 16)), ("2+", (70, 18, 24))],
    "Erythrocytes": [("neg", (92, -2, 6)), ("trace", (84, -4, 10)), ("1+", (72, -6, 14)), ("2+", (60, -8, 18)), ("3+", (50, -10, 22))],
}

PH_SCALE = [
    (5.0, (92, -2, 6)), (6.0, (84, -4, 8)),
    (7.0, (76, -6, 10)), (8.0, (68, -8, 12)),
]

SG_SCALE = [
    (1.005, (94, -2, 6)), (1.010, (88, -4, 8)), (1.015, (82, -6, 10)),
    (1.020, (76, -8, 12)), (1.025, (70, -10, 14)), (1.030, (64, -12, 16)),
]

# Reference ranges for reporting
REFERENCE_RANGES = {
    "Specific Gravity": "1.005–1.030",
    "pH": "5.0–8.0",
    "Leukocytes": "Negative",
    "Nitrite": "Negative",
    "Protein": "Negative",
    "Glucose": "Negative",
    "Ketone": "Negative",
    "Urobilinogen": "0.2–1.0 mg/dL",
    "Bilirubin": "Negative",
    "Erythrocytes": "Negative",
}


# ── schemas ─────────────────────────────────────────────────────
class UrinalysisRequest(BaseModel):
    image: str  # base64
    name: str
    age: Optional[int] = None


class UrineParameter(BaseModel):
    name: str
    value: str
    unit: str
    referenceRange: str
    status: str
    confidence: Optional[float] = None


class UrinalysisResponse(BaseModel):
    parameters: List[UrineParameter]
    diseases: List[str]
    clinicalRisk: str
    confidenceScore: float


# ── helpers ─────────────────────────────────────────────────────
def _decode_image(b64: str) -> np.ndarray:
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    raw = base64.b64decode(b64)
    arr = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return img


def _normalize(img: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(2.0, (8, 8)).apply(l)
    return cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)


def _detect_strip(img: np.ndarray) -> np.ndarray:
    yolo = models.get("yolo_model")
    if yolo is None:
        return img
    try:
        res = yolo(img, conf=0.15)[0]
        if res.boxes is None or len(res.boxes) == 0:
            return img
        box = res.boxes.xyxy.cpu().numpy()
        box = box[np.argmax(res.boxes.conf.cpu().numpy())]
        x1, y1, x2, y2 = map(int, box)
        return img[y1:y2, x1:x2]
    except Exception:
        return img


def _split_pads(strip: np.ndarray) -> list:
    h, w, _ = strip.shape
    pad_w = w // NUM_PADS
    pads = []
    for i in range(NUM_PADS):
        p = strip[:, i * pad_w:(i + 1) * pad_w]
        p = p[int(0.25 * h):int(0.75 * h), int(0.25 * pad_w):int(0.75 * pad_w)]
        pads.append(cv2.GaussianBlur(p, (5, 5), 0))
    return pads


def _mean_lab(pad: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(pad, cv2.COLOR_BGR2LAB)
    return np.mean(lab.reshape(-1, 3), axis=0)


def _deltaE(a, b):
    return float(np.linalg.norm(np.array(a) - np.array(b)))


def _roche_label(test: str, lab) -> tuple[str, float]:
    ref = ROCHE_CHART[test]
    distances = [(_deltaE(lab, c), lbl) for lbl, c in ref]
    best = min(distances, key=lambda x: x[0])
    max_dist = max(d for d, _ in distances) or 1.0
    confidence = round((1 - best[0] / max_dist) * 100, 1)
    return best[1], confidence


def _numeric_label(lab, scale):
    distances = [(_deltaE(lab, c), v) for v, c in scale]
    best = min(distances, key=lambda x: x[0])
    max_dist = max(d for d, _ in distances) or 1.0
    confidence = round((1 - best[0] / max_dist) * 100, 1)
    return best[1], confidence


def _status_from_label(test: str, label: str) -> str:
    """Map a Roche label to a risk status for the frontend."""
    if test in ("pH", "Specific Gravity"):
        return "Normal"
    if label in ("neg", "normal", "Negative"):
        return "Normal"
    if label == "trace":
        return "Mild"
    return "High"


def _run_disease_logic(results: dict) -> list[str]:
    """Rule-based disease prediction."""
    diseases = []
    if results.get("Leukocytes") in ("1+", "2+", "3+") and results.get("Nitrite") == "pos":
        diseases.append("Urinary Tract Infection (UTI)")
    if results.get("Glucose") in ("2+", "3+", "4+"):
        diseases.append("Diabetes Mellitus")
    if results.get("Ketone") in ("2+", "3+") and results.get("Glucose") in ("2+", "3+", "4+"):
        diseases.append("Ketosis / Possible DKA")
    sg_val = results.get("Specific Gravity", "1.000")
    if results.get("Protein") in ("2+", "3+") or float(sg_val) > 1.025:
        diseases.append("Possible Kidney Disease")
    if results.get("Bilirubin") in ("1+", "2+") or results.get("Urobilinogen") in ("2+", "3+"):
        diseases.append("Possible Liver Dysfunction")
    if results.get("Erythrocytes") in ("1+", "2+", "3+"):
        diseases.append("Hematuria")
    return diseases


def _compute_clinical_risk(diseases: list[str], params: list[UrineParameter]) -> str:
    high_count = sum(1 for p in params if p.status == "High")
    if high_count >= 4 or len(diseases) >= 3:
        return "CRITICAL"
    if high_count >= 2 or len(diseases) >= 2:
        return "HIGH RISK"
    if high_count >= 1 or len(diseases) >= 1:
        return "MODERATE RISK"
    return "LOW RISK"


# ── endpoint ────────────────────────────────────────────────────
@router.post("/urinalysis/analyze", response_model=UrinalysisResponse)
async def analyze_urinalysis(req: UrinalysisRequest):
    try:
        img = _decode_image(req.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    img = _normalize(img)
    strip = _detect_strip(img)
    pads = _split_pads(strip)

    raw_results: dict[str, str] = {}
    parameters: list[UrineParameter] = []

    for i, pad in enumerate(pads[:-1]):  # skip Color pad
        test = PAD_NAMES[i]
        lab = _mean_lab(pad)

        if test == "Nitrite":
            label = "pos" if lab[2] < 130 else "neg"
            conf = 95.0
        elif test == "pH":
            val, conf = _numeric_label(lab, PH_SCALE)
            label = str(val)
        elif test == "Specific Gravity":
            val, conf = _numeric_label(lab, SG_SCALE)
            label = f"{val:.3f}"
        else:
            label, conf = _roche_label(test, lab)

        raw_results[test] = label
        status = _status_from_label(test, label)

        parameters.append(UrineParameter(
            name=test,
            value=label,
            unit="",
            referenceRange=REFERENCE_RANGES.get(test, ""),
            status=status,
            confidence=conf,
        ))

    diseases = _run_disease_logic(raw_results)
    risk = _compute_clinical_risk(diseases, parameters)
    avg_conf = round(sum(p.confidence or 0 for p in parameters) / max(len(parameters), 1), 1)

    # persist record in local DB
    try:
        db = SessionLocal()
        record = ScreeningRecord(
            patient_name=req.name,
            age=req.age or 0,
            screening_type="urinalysis",
            result_value=0.0,
            risk=risk,
            synced=False,
        )
        db.add(record)
        db.commit()
    finally:
        db.close()

    return UrinalysisResponse(
        parameters=parameters,
        diseases=diseases,
        clinicalRisk=risk,
        confidenceScore=avg_conf,
    )
