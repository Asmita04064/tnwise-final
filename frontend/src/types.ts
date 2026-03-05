/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'ta';

export type RiskLevel = 'Normal' | 'Mild' | 'High' | 'Negative' | 'Positive';
export type HbInterpretation = 'Normal' | 'Mild Anemia' | 'Moderate Anemia' | 'Severe Anemia';
export type Priority = 'Green' | 'Yellow' | 'Red' | 'Critical';
export type ClinicalRisk = 'LOW RISK' | 'MODERATE RISK' | 'HIGH RISK' | 'CRITICAL';
export type ScreeningType = 'urine' | 'blood' | 'both';

export interface LabParameter {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: RiskLevel;
  confidence?: number;
}

export interface ScreeningData {
  screeningType: ScreeningType;
  urineParameters?: LabParameter[];
  bloodParameters?: LabParameter[];
  hbValue: number;
  hbInterpretation: HbInterpretation;
  priority: Priority;
  clinicalRisk: ClinicalRisk;
  clinicalInterpretations?: string[];
  confidenceScore: number;
  modelVersion: string;
  datasetSize: number;
  qualityCheck: {
    imageQuality: 'Good' | 'Poor';
    detectionConfidence: number;
    lightingPassed: boolean;
  };
  metadata: {
    location: string;
    workerId: string;
    deviceId: string;
    offlineMode: boolean;
    timestamp: string;
  };
  date: string;
  patientName: string;
  age: number;
  village: string;
  phone: string;
  history?: { date: string; hb: number; infectionFlags: number }[];
}

export interface PatientInfo {
  name: string;
  age: string;
  village: string;
  phone: string;
}

export interface Translation {
  appName: string;
  tagline: string;
  startScreening: string;
  viewReports: string;
  about: string;
  aboutText: string;
  alignStrip: string;
  capture: string;
  processing: string;
  results: string;
  urineParameters: string;
  glucose: string;
  protein: string;
  leukocytes: string;
  nitrite: string;
  hemoglobin: string;
  hbValue: string;
  interpretation: string;
  doctorPriority: string;
  explanation: string;
  downloadPdf: string;
  shareWhatsapp: string;
  returnHome: string;
  routineVisit: string;
  visitPHC7Days: string;
  immediateReferral: string;
  disclaimer: string;
  normal: string;
  mild: string;
  high: string;
  negative: string;
  positive: string;
  mildAnemia: string;
  moderateAnemia: string;
  severeAnemia: string;
  enterPhone: string;
  phonePlaceholder: string;
  continue: string;
  previousReports: string;
  noReports: string;
  patientDetails: string;
  patientName: string;
  age: string;
  village: string;
  namePlaceholder: string;
  agePlaceholder: string;
  villagePlaceholder: string;
  parameter: string;
  result: string;
  unit: string;
  refRange: string;
  labReport: string;
  selectSource: string;
  useCamera: string;
  uploadImage: string;
  // New Clinical Keys
  lowRisk: string;
  moderateRisk: string;
  highRisk: string;
  criticalRisk: string;
  aiConfidence: string;
  modelVersion: string;
  datasetSize: string;
  whyThisDecision: string;
  testQualityCheck: string;
  imageQuality: string;
  detectionConfidence: string;
  lightingCalibration: string;
  passed: string;
  failed: string;
  recommendedAction: string;
  visitPHC24h: string;
  repeatUrineTest: string;
  confirmatoryHbTest: string;
  ironSupplements: string;
  doctorConsultationMandatory: string;
  screeningLocation: string;
  screenedBy: string;
  deviceId: string;
  offlineStatus: string;
  enabled: string;
  synced: string;
  viewHealthTrends: string;
  impactSummary: string;
  totalScreenings: string;
  highRiskIdentified: string;
  referralsGenerated: string;
  anemiaCasesFlagged: string;
  stepIndicator: string;
  requiredField: string;
  good: string;
  poor: string;
  dipAndPlace: string;
  startTimer: string;
  timerInstruction: string;
  secondsRemaining: string;
  patientCount: string;
  analyzingImage: string;
  skip: string;
  selectScreeningType: string;
  urineAnalysis: string;
  bloodAnalysis: string;
  bothAnalysis: string;
  captureBloodStrip: string;
  captureUrineStrip: string;
  bloodParameters: string;
}

export interface User {
  id: string;
  name: string;
  password: string;
}
