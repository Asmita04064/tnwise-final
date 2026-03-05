"""
Nalam Thedi Lab — FastAPI Backend
Integrates hemoglobin prediction (CV + Linear Regression) and
urinalysis strip analysis (CV + Roche LAB color matching) with the
React frontend, and optionally routes through Google Gemini for
AI-powered analysis.
"""

import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# database imports
from database import engine, SessionLocal
from models_db import Base, ScreeningRecord

# --------------- paths ---------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# Add sibling project dirs to sys.path so we can import helpers
sys.path.insert(0, os.path.join(PROJECT_ROOT, "Models", "Hemogoblin"))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "Models", "M2_Analysis"))

load_dotenv(os.path.join(PROJECT_ROOT, ".env.local"))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# --------------- app state (loaded once) ---------------
from app_state import models  # noqa: E402

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models once at startup."""
    from model_loader import load_all_models
    load_all_models(models, PROJECT_ROOT)
    yield

# --------------- FastAPI app ---------------
app = FastAPI(
    title="Nalam Thedi Lab API",
    version="1.0.0",
    description="Backend API for hemoglobin prediction, urinalysis, and Gemini AI analysis",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------- routes ---------------
from routes.hemoglobin import router as hb_router  # noqa: E402
from routes.urinalysis import router as urine_router  # noqa: E402
from routes.analyze import router as analyze_router  # noqa: E402

app.include_router(hb_router, prefix="/api")
app.include_router(urine_router, prefix="/api")
app.include_router(analyze_router, prefix="/api")

# create tables on startup
Base.metadata.create_all(bind=engine)



# helper for connectivity
import requests

def is_online():
    try:
        requests.get("https://www.google.com", timeout=3)
        return True
    except Exception:
        return False

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "models": {
            "hemoglobin": models.get("hb_model") is not None,
            "urinalysis_yolo": models.get("yolo_model") is not None,
        },
    }

# simple root to avoid 404 when browsed directly
@app.get("/", include_in_schema=False)
def root():
    return {"message": "Nalam Thedi Lab API"}

# serve or ignore favicon requests to suppress 404
from fastapi.responses import Response

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    # no actual icon served by backend; return empty 204
    return Response(status_code=204)

# sync endpoint or background task

def sync_unsynced():
    db = SessionLocal()
    unsynced = db.query(ScreeningRecord).filter_by(synced=False).all()
    for record in unsynced:
        if is_online():
            try:
                # replace with actual PHC cloud URL
                requests.post("https://phc-cloud-api.com/upload", json={
                    "patient_name": record.patient_name,
                    "hemoglobin": record.hemoglobin,
                    "risk": record.risk,
                }, timeout=5)
                record.synced = True
            except Exception:
                pass
    db.commit()
    db.close()

@app.post("/api/trigger-sync")
def trigger_sync(background: BackgroundTasks):
    background.add_task(sync_unsynced)
    return {"queued": True}

@app.get("/api/local-records")
def get_local_records():
    db = SessionLocal()
    records = db.query(ScreeningRecord).all()
    db.close()
    return records
