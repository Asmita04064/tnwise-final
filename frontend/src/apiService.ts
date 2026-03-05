/**
 * apiService.ts — Calls the FastAPI backend for image analysis.
 *
 * Provides two paths:
 *   1. analyzeViaBackend()  → local CV models (hemoglobin + urinalysis)
 *   2. analyzeViaGemini()   → Gemini AI through the backend (server-side key)
 *
 * The backend base URL is resolved via the Vite proxy ("/api" → FastAPI).
 */

const API_BASE = "/api";

// ── types matching the backend response ────────────────────────
export interface LabParam {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: string;
  confidence?: number;
}

export interface AnalyzeResponse {
  urineParameters?: LabParam[];
  bloodParameters?: LabParam[];
  hbValue: number;
  hbInterpretation: string;
  clinicalRisk: string;
  confidenceScore: number;
  clinicalInterpretations?: string[];
  diseases?: string[];
}

export interface HbPredictResponse {
  hb_value: number;
  hb_interpretation: string;
  risk_label: string;
  lab_features: { L: number; A: number; B: number };
  confidence: number;
}

// ── health check ───────────────────────────────────────────────
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── combined analysis (main endpoint) ──────────────────────────
export async function analyzeViaBackend(
  bloodImage: string | null,
  urineImage: string | null,
  screeningType: "urine" | "blood" | "both",
  useGemini = false,
): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      screeningType,
      bloodImage,
      urineImage,
      useGemini,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Backend error ${res.status}`);
  }

  return res.json();
}

// ── hemoglobin-only endpoint ───────────────────────────────────
export async function predictHemoglobin(image: string): Promise<HbPredictResponse> {
  const res = await fetch(`${API_BASE}/hemoglobin/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Backend error ${res.status}`);
  }

  return res.json();
}

// ── urinalysis-only endpoint ───────────────────────────────────
export async function analyzeUrinalysis(image: string) {
  const res = await fetch(`${API_BASE}/urinalysis/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Backend error ${res.status}`);
  }

  return res.json();
}
