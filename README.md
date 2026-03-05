# Medical Image Analysis Suite

A collection of AI-powered tools for non-invasive medical diagnostics using computer vision and machine learning. The project contains three independent systems:

1. **Nalam Thedi Lab** — A full-stack web app for AI-powered rural health screening (React + FastAPI + Gemini AI)
2. **FastAPI Backend** — Unified API server integrating hemoglobin prediction, urinalysis analysis, and Gemini AI
3. **Hemoglobin Prediction** — Estimates hemoglobin levels from blood sample images
4. **Urinalysis AI** — Analyzes urinalysis test strips for disease screening

---

## Table of Contents

- [Nalam Thedi Lab](#nalam-thedi-lab)
  - [Overview](#overview)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [App Workflow](#app-workflow)
  - [Usage](#usage)
- [FastAPI Backend](#fastapi-backend)
  - [Architecture](#architecture)
  - [API Endpoints](#api-endpoints)
  - [Usage](#usage-1)
- [Hemoglobin Prediction](#hemoglobin-prediction)
  - [Overview](#overview-1)
  - [How It Works](#how-it-works)
  - [Dataset Structure](#dataset-structure)
  - [Usage](#usage-2)
  - [Scripts](#scripts)
- [Urinalysis AI System](#urinalysis-ai-system)
  - [Overview](#overview-2)
  - [How It Works](#how-it-works-1)
  - [Usage](#usage-2)
  - [Disease Detection](#disease-detection)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [License](#license)

---

## Nalam Thedi Lab

### Overview

**Nalam Thedi Lab** ("நலம் தேடி" — Tamil for "Seeking Wellness") is an AI-powered clinical diagnostic web application designed for **rural healthcare workers** in India. It enables affordable, on-the-spot screening for anemia and urinary tract conditions using smartphone cameras and AI-driven test strip analysis.

The app integrates with a **FastAPI backend** that runs local CV/ML models for hemoglobin and urinalysis analysis, with an optional **Google Gemini AI** fallback for enhanced analysis. Results are provided in both **English and Tamil**.

### Features

- **Urine Strip Analysis** — Captures and analyzes 10-parameter urine test strips via camera or image upload
- **Blood Strip Analysis** — Analyzes blood test strips for Glucose, Hb, Cholesterol, and Uric Acid
- **Combined Screening** — Run both urine and blood analysis in a single session
- **Gemini AI Integration** — Uses Google Gemini (`gemini-3-flash-preview`) with structured JSON output for colorimetric strip analysis
- **Bilingual Support** — Full English and Tamil (தமிழ்) interface
- **PDF Report Generation** — Downloadable lab reports via jsPDF
- **WhatsApp Sharing** — One-tap report sharing to patients/doctors
- **Clinical Risk Scoring** — Automated 4-tier risk classification (Low / Moderate / High / Critical)
- **Anemia Detection** — Hb-based classification: Normal, Mild, Moderate, Severe
- **Patient History Tracking** — Longitudinal health trends with charting (Recharts)
- **Quality Checks** — Image quality, strip detection confidence, and lighting calibration validation
- **Offline-Ready Metadata** — Tracks device ID, worker ID, location, and sync status

### Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Frontend     | React 19, TypeScript, Tailwind CSS 4, Vite 6    |
| Backend      | FastAPI, Uvicorn, Python 3.10+                   |
| ML Models    | scikit-learn (Hb regression), YOLOv8 (strip detection) |
| AI Fallback  | Google Gemini API (`@google/genai`)              |
| Charts       | Recharts                                         |
| PDF          | jsPDF + jspdf-autotable                          |
| Animations   | Motion (Framer Motion)                           |
| Icons        | Lucide React                                     |

### App Workflow

1. **Splash Screen** → **Home** (language toggle, start screening, view past reports)
2. **Patient Details** — Name, age, village, phone number
3. **Screening Type Selection** — Urine, Blood, or Both
4. **Image Capture** — Camera or file upload with alignment guide
5. **Timer** — 60-second wait for strip color development
6. **AI Processing** — Image analyzed by FastAPI backend (local CV models), with Gemini AI fallback
7. **Results** — Full parameter breakdown, risk level, clinical interpretations, quality check, and recommended actions
8. **Export** — Download PDF or share via WhatsApp

### Usage

```bash
# Terminal 1 — Start the FastAPI backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Start the React frontend
cd Nalam-Thedi
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and proxies `/api` requests to the FastAPI backend at `http://localhost:8000`.

---

## FastAPI Backend

### Architecture

The FastAPI backend serves as a unified API layer that connects the React frontend to the Python-based CV/ML models:

```
┌─────────────────────┐       ┌─────────────────────────────────┐
│   React Frontend    │──────▶│       FastAPI Backend           │
│   (localhost:3000)  │  /api │       (localhost:8000)           │
└─────────────────────┘       │                                 │
                              │  ┌───────────────────────────┐  │
                              │  │ /api/analyze              │  │
                              │  │   Combined screening      │  │
                              │  ├───────────────────────────┤  │
                              │  │ /api/hemoglobin/predict   │  │
                              │  │   Blood → Hb prediction   │  │
                              │  ├───────────────────────────┤  │
                              │  │ /api/urinalysis/analyze   │  │
                              │  │   Strip → 10 parameters   │  │
                              │  ├───────────────────────────┤  │
                              │  │ /api/health               │  │
                              │  │   Health check            │  │
                              │  └───────────────────────────┘  │
                              │                                 │
                              │  Models loaded at startup:      │
                              │  • LinearRegression (.pkl)      │
                              │  • StandardScaler (.pkl)        │
                              │  • YOLOv8 (.pt) — optional     │
                              │  • Gemini API — optional        │
                              └─────────────────────────────────┘
```

The frontend automatically detects backend availability on startup. If the backend is unreachable, it falls back to direct Gemini API calls from the browser.

### API Endpoints

| Method | Endpoint                  | Description                                           |
| ------ | ------------------------- | ----------------------------------------------------- |
| GET    | `/api/health`             | Returns model load status                             |
| POST   | `/api/analyze`            | Combined analysis — accepts blood/urine images, runs local CV models or Gemini |
| POST   | `/api/hemoglobin/predict` | Hemoglobin prediction from a blood sample image       |
| POST   | `/api/urinalysis/analyze` | Urinalysis strip analysis (10 parameters + diseases)  |

#### POST `/api/analyze` — Request Body

```json
{
  "screeningType": "urine",
  "bloodImage": "data:image/jpeg;base64,...",
  "urineImage": "data:image/jpeg;base64,...",
  "useGemini": false
}
```

#### POST `/api/analyze` — Response

```json
{
  "urineParameters": [
    { "name": "pH", "value": "6.0", "unit": "", "referenceRange": "5.0–8.0", "status": "Normal", "confidence": 85.2 }
  ],
  "bloodParameters": [
    { "name": "Hb", "value": "11.5", "unit": "g/dL", "referenceRange": "12–16 g/dL", "status": "Mild", "confidence": 88.0 }
  ],
  "hbValue": 11.5,
  "hbInterpretation": "Mild Anemia",
  "clinicalRisk": "MODERATE RISK",
  "confidenceScore": 85.2,
  "clinicalInterpretations": ["Low hemoglobin detected (11.5 g/dL) — anemia risk"],
  "diseases": []
}
```

### Usage

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# (Optional) Set Gemini API key for AI fallback
# Create .env with: GEMINI_API_KEY=your_key_here

# Start the server
uvicorn main:app --reload --port 8000

# Test the health endpoint
curl http://localhost:8000/api/health
```

---

## Hemoglobin Prediction

### Overview

Predicts hemoglobin (Hb) concentration (g/dL) from blood sample images using color analysis in the **CIE LAB** color space and a **Linear Regression** model. It also provides an anemia risk classification based on the predicted value.

### How It Works

1. **Circle Detection** — Uses Hough Circle Transform to isolate the circular blood sample region in the image. Falls back to a center crop if detection fails.
2. **LAB Feature Extraction** — Converts the detected region to CIE LAB color space, applies histogram equalization on the L (lightness) channel, and computes the mean L, A, B values.
3. **Regression** — A `LinearRegression` model (scikit-learn) trained on extracted LAB features predicts the Hb level.
4. **Anemia Risk Assessment** — Classifies the result into one of four risk categories:

| Predicted Hb (g/dL) | Risk Level            |
| -------------------- | --------------------- |
| ≥ 12                 | Normal                |
| 10 – 11.9            | Mild Anemia Risk      |
| 8 – 9.9              | Moderate Anemia Risk  |
| < 8                  | Severe Anemia Risk    |

### Dataset Structure

Training and test images are organized in folders named by hemoglobin level:

```
dataset/            # Training data
├── 6gdl/           # Images with Hb ≈ 6 g/dL
├── 10gdl/
└── ...

test_dataset/       # Test data
├── 6gbl/
├── 8gbl/
├── 10gbl/
├── 12gbl/
└── 14gbl/
```

The `CROP.py` script can generate synthetic training images at various Hb levels from a single reference blood sample image by adjusting LAB channel values.

### Usage

```bash
cd hemoglobin-prediction

# 1. Train the model
python main.py

# 2. Predict from a single image
python predict.py

# 3. Batch predict on a test folder
python batch_predict.py

# 4. Visualize circle detection on an image
python visualize.py <image_path>
```

### Scripts

| Script              | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `main.py`           | Loads dataset, extracts features, trains the Linear Regression model, saves `.pkl` files, and plots actual vs predicted results. |
| `predict.py`        | Loads a trained model and predicts Hb from a single user-provided image.    |
| `batch_predict.py`  | Runs predictions on an entire folder of test images and reports MAE.        |
| `CROP.py`           | Generates synthetic blood sample images at different Hb levels by adjusting LAB channels from a reference image. |
| `visualize.py`      | Displays the original image alongside the detected circle overlay.          |

**Trained model artifacts** (generated by `main.py`):
- `hb_regression_model.pkl` — Trained LinearRegression model
- `hb_scaler.pkl` — StandardScaler fitted on training data

---

## Urinalysis AI System

### Overview

Analyzes urinalysis test strip images to detect and quantify 10 biochemical parameters and predict potential diseases. Uses a **YOLOv8** model for strip detection and **CIE LAB color matching** against Roche reference charts.

### How It Works

1. **Image Preprocessing** — Applies CLAHE (Contrast Limited Adaptive Histogram Equalization) in LAB color space for lighting normalization.
2. **Strip Detection** — A YOLOv8 model (`urinalysis_model3_best.pt`) detects and crops the test strip from the image. Falls back to using the full image if detection fails.
3. **Pad Segmentation** — Splits the detected strip into 11 individual test pads.
4. **Color Matching** — Computes the mean LAB color of each pad and matches it against Roche reference values using Delta E (Euclidean distance in LAB space).
5. **Clinical Interpretation** — Applies rule-based logic to flag potential diseases.

#### Analyzed Parameters

| Pad                | Method                     |
| ------------------ | -------------------------- |
| Specific Gravity   | Numeric scale matching     |
| pH                 | Numeric scale matching     |
| Leukocytes         | Roche chart color matching |
| Nitrite            | B-channel threshold        |
| Protein            | Roche chart color matching |
| Glucose            | Roche chart color matching |
| Ketone             | Roche chart color matching |
| Urobilinogen       | Roche chart color matching |
| Bilirubin          | Roche chart color matching |
| Erythrocytes       | Roche chart color matching |

### Usage

```bash
cd urinalysis-ai-system


# Copy your strip image to the data folder
python setup_image.py

# Run the analysis
python urinalysis.py
```

The system outputs:
- A **strip report** with results for all 10 parameters
- A **clinical interpretation** listing suspected conditions
- A **visualization** saved as `analysis_result.png`

### Disease Detection

The system screens for the following conditions based on combined parameter results:

| Condition                          | Trigger Criteria                                         |
| ---------------------------------- | -------------------------------------------------------- |
| Urinary Tract Infection (UTI)      | Leukocytes ≥ 1+ **and** Nitrite positive                |
| Diabetes Mellitus                  | Glucose ≥ 2+                                             |
| Ketosis / Possible DKA             | Ketone ≥ 2+ **and** Glucose ≥ 2+                        |
| Possible Kidney Disease            | Protein ≥ 2+ **or** Specific Gravity > 1.025            |
| Possible Liver Dysfunction         | Bilirubin ≥ 1+ **or** Urobilinogen ≥ 2+                 |
| Hematuria                          | Erythrocytes ≥ 1+                                        |

---

## Installation

### Prerequisites

- Python 3.8+

### Hemoglobin Prediction

```bash
cd hemoglobin-prediction
pip install -r requirements.txt
```

**Dependencies:** numpy, opencv-python, scikit-learn, matplotlib, joblib

### FastAPI Backend

```bash
cd backend
pip install -r requirements.txt
```

**Dependencies:** fastapi, uvicorn, python-multipart, numpy, opencv-python, scikit-learn, joblib, google-genai, Pillow

### Nalam Thedi Lab

```bash
cd Nalam-Thedi
npm install
```

**Dependencies:** React 19, Vite 6, Tailwind CSS 4, @google/genai, jsPDF, Recharts, Lucide React, Motion

### Urinalysis AI

```bash
cd urinalysis-ai-system
pip install -r requirements.txt
```

**Dependencies:** opencv-python (≥4.7.0), numpy (≥1.23.0), matplotlib (≥3.5.0), ultralytics (≥8.0.0)

---

## Project Structure

```
Ashmita_Project/
│
├── backend/                  # FastAPI backend (API server)
│   ├── main.py               # FastAPI app entry point
│   ├── app_state.py          # Shared model state
│   ├── model_loader.py       # ML model loading at startup
│   ├── requirements.txt
│   ├── .env.example
│   └── routes/
│       ├── analyze.py        # Combined analysis endpoint
│       ├── hemoglobin.py     # Hb prediction endpoint
│       └── urinalysis.py     # Urinalysis analysis endpoint
│
├── Nalam-Thedi/              # React frontend (web app)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts        # Includes /api proxy to FastAPI
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── App.tsx           # Main app with screen routing
│       ├── apiService.ts     # Backend API client
│       ├── types.ts          # TypeScript interfaces & types
│       ├── LanguageConfig.ts # English & Tamil translations
│       ├── utils.ts          # Utility functions
│       └── components/
│           ├── SplashScreen.tsx
│           ├── HomeScreen.tsx
│           ├── PatientDetailsScreen.tsx
│           ├── ScreeningTypeScreen.tsx
│           ├── SourceSelectionScreen.tsx
│           ├── CameraScreen.tsx
│           ├── TimerScreen.tsx
│           ├── ProcessingScreen.tsx
│           ├── ResultsScreen.tsx
│           ├── ReportsScreen.tsx
│           ├── PDFGenerator.ts
│           └── Logo.tsx
│
├── hemoglobin-prediction/    # Hb prediction from blood images
│   ├── main.py               # Model training pipeline
│   ├── predict.py            # Single-image prediction
│   ├── batch_predict.py      # Batch prediction & evaluation
│   ├── CROP.py               # Synthetic dataset generator
│   ├── visualize.py          # Circle detection visualizer
│   ├── requirements.txt
│   ├── dataset/              # Training images (by Hb level)
│   └── test_dataset/         # Test images (by Hb level)
│
├── urinalysis-ai-system/     # Urinalysis strip analysis (Python)
│   ├── urinalysis.py         # Main analysis script
│   ├── setup_image.py        # Image setup helper
│   ├── requirements.txt
│   ├── data/                 # Input strip images
│   └── models/               # YOLOv8 model weights
│
└── README.md
```

---

## License

This project is for educational and research purposes.
