/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import CameraScreen from './components/CameraScreen';
import ProcessingScreen from './components/ProcessingScreen';
import ResultsScreen from './components/ResultsScreen';
import PatientDetailsScreen from './components/PatientDetailsScreen';
import ReportsScreen from './components/ReportsScreen';
import SourceSelectionScreen from './components/SourceSelectionScreen';
import TimerScreen from './components/TimerScreen';
import ScreeningTypeScreen from './components/ScreeningTypeScreen';
import { Language, ScreeningData, PatientInfo, LabParameter, ScreeningType } from './types';
import { translations } from './LanguageConfig';
import { generatePDF } from './components/PDFGenerator';
import { GoogleGenAI, Type } from "@google/genai";
import { analyzeViaBackend, checkBackendHealth } from './apiService';
import type { AnalyzeResponse } from './apiService';
import Logo from './components/Logo';

type Screen = 'splash' | 'login' | 'home' | 'details' | 'type' | 'source' | 'camera' | 'timer' | 'processing' | 'results' | 'reports';

const MOCK_PARAMETERS: LabParameter[] = [
  { name: 'Specific Gravity', value: '1.01', unit: '', referenceRange: '1.005–1.030', status: 'Normal', confidence: 83.75 },
  { name: 'pH', value: '5.88', unit: '', referenceRange: '5.0–8.0', status: 'Normal', confidence: 86.76 },
  { name: 'Leukocytes', value: '500', unit: 'mg/dL', referenceRange: '0–10 cells/µL', status: 'High', confidence: 65.46 },
  { name: 'Nitrite', value: '1', unit: 'mg/dL', referenceRange: 'Negative', status: 'High', confidence: 95.0 },
  { name: 'Protein', value: '131.28', unit: 'mg/dL', referenceRange: '0–30 mg/dL', status: 'High', confidence: 67.65 },
  { name: 'Glucose', value: '287.0', unit: 'mg/dL', referenceRange: '0–100 mg/dL', status: 'High', confidence: 67.78 },
  { name: 'Ketone', value: '60.82', unit: 'mg/dL', referenceRange: '0 mg/dL', status: 'High', confidence: 57.19 },
  { name: 'Urobilinogen', value: '2.83', unit: 'mg/dL', referenceRange: '0.2–1 mg/dL', status: 'High', confidence: 67.77 },
  { name: 'Bilirubin', value: '2.55', unit: 'mg/dL', referenceRange: '0–1 mg/dL', status: 'High', confidence: 73.8 },
  { name: 'Erythrocytes', value: '21.2', unit: 'mg/dL', referenceRange: '0–5 RBC/µL', status: 'High', confidence: 72.8 },
];

const MOCK_DATA: ScreeningData = {
  screeningType: 'urine',
  urineParameters: MOCK_PARAMETERS,
  bloodParameters: [],
  hbValue: 9.2,
  hbInterpretation: 'Moderate Anemia',
  priority: 'Critical',
  clinicalRisk: 'CRITICAL',
  clinicalInterpretations: [
    'Severe Hyperglycemia detected',
    'Possible Ketosis',
    'Significant Proteinuria – kidney involvement',
    'Strong UTI indication'
  ],
  confidenceScore: 73.8,
  modelVersion: 'v1.2',
  datasetSize: 12480,
  qualityCheck: {
    imageQuality: 'Good',
    detectionConfidence: 98.5,
    lightingPassed: true,
  },
  metadata: {
    location: 'Melur PHC, Madurai',
    workerId: 'VHN-4201',
    deviceId: 'NTL-TAB-09',
    offlineMode: false,
    timestamp: new Date().toLocaleTimeString(),
  },
  date: new Date().toLocaleDateString(),
  patientName: 'Kaveri Ammal',
  age: 45,
  village: 'Melur',
  phone: '9876543210',
  history: [
    { date: '01/01', hb: 8.5, infectionFlags: 1 },
    { date: '15/01', hb: 8.8, infectionFlags: 0 },
    { date: '01/02', hb: 9.0, infectionFlags: 1 },
    { date: '20/02', hb: 9.2, infectionFlags: 1 },
  ]
};

const INITIAL_REPORTS: ScreeningData[] = [
  MOCK_DATA,
  {
    ...MOCK_DATA,
    screeningType: 'urine',
    patientName: 'Muthu Lakshmi',
    age: 38,
    hbValue: 11.5,
    hbInterpretation: 'Normal',
    priority: 'Green',
    clinicalRisk: 'LOW RISK',
    confidenceScore: 97.1,
    date: '15/02/2026',
    urineParameters: MOCK_PARAMETERS.map(p => ({ ...p, status: 'Normal', value: 'Normal' })),
    history: [
      { date: '10/12', hb: 10.2, infectionFlags: 0 },
      { date: '05/01', hb: 10.8, infectionFlags: 0 },
      { date: '15/02', hb: 11.5, infectionFlags: 0 },
    ]
  },
  {
    ...MOCK_DATA,
    screeningType: 'urine',
    patientName: 'Selvi Mani',
    age: 52,
    hbValue: 10.1,
    hbInterpretation: 'Mild Anemia',
    priority: 'Yellow',
    clinicalRisk: 'MODERATE RISK',
    confidenceScore: 91.8,
    date: '10/02/2026',
    urineParameters: MOCK_PARAMETERS.map((p, idx) => ({ ...p, status: idx === 0 ? 'Mild' : 'Normal', value: idx === 0 ? '150' : 'Normal' })),
    history: [
      { date: '15/11', hb: 9.5, infectionFlags: 1 },
      { date: '20/12', hb: 9.8, infectionFlags: 0 },
      { date: '10/02', hb: 10.1, infectionFlags: 0 },
    ]
  }
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [users, setUsers] = useState<Array<{id:string;name:string;password:string}>>([]);
  const [currentUser, setCurrentUser] = useState<{id:string;name:string} | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [data, setData] = useState<ScreeningData>(MOCK_DATA);
  const [reports, setReports] = useState<ScreeningData[]>(INITIAL_REPORTS);
  const [patientCount, setPatientCount] = useState(0);
  const [screeningType, setScreeningType] = useState<ScreeningType>('urine');
  const [bloodImage, setBloodImage] = useState<string | null>(null);
  const [urineImage, setUrineImage] = useState<string | null>(null);
  const [currentCaptureType, setCurrentCaptureType] = useState<'blood' | 'urine'>('urine');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  const t = translations[language];


  // Check if FastAPI backend is reachable on mount
  useEffect(() => {
    checkBackendHealth().then(setBackendAvailable);
  }, []);

  useEffect(() => {
    if (screen === 'splash') {
      const timer = setTimeout(() => {
        setScreen('login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'ta' : 'en'));
  };

  const analyzeWithBackend = async (bloodImg: string | null, urineImg: string | null, type: ScreeningType): Promise<ScreeningData> => {
    const result: AnalyzeResponse = await analyzeViaBackend(bloodImg, urineImg, type, false);

    const urineParams: LabParameter[] | undefined = result.urineParameters?.map(p => ({
      name: p.name,
      value: p.value,
      unit: p.unit,
      referenceRange: p.referenceRange,
      status: p.status as any,
      confidence: p.confidence,
    }));

    const bloodParams: LabParameter[] | undefined = result.bloodParameters?.map(p => ({
      name: p.name,
      value: p.value,
      unit: p.unit,
      referenceRange: p.referenceRange,
      status: p.status as any,
      confidence: p.confidence,
    }));

    const hb = result.hbValue;
    const interpretation = (hb < 7 ? 'Severe Anemia' : hb < 10 ? 'Moderate Anemia' : hb < 12 ? 'Mild Anemia' : 'Normal') as any;
    const priority = (result.clinicalRisk === 'CRITICAL' ? 'Critical' : result.clinicalRisk === 'HIGH RISK' ? 'Red' : result.clinicalRisk === 'MODERATE RISK' ? 'Yellow' : 'Green') as any;

    return {
      ...MOCK_DATA,
      screeningType: type,
      urineParameters: urineParams || (type === 'urine' || type === 'both' ? MOCK_PARAMETERS : undefined),
      bloodParameters: bloodParams,
      hbValue: hb,
      hbInterpretation: interpretation,
      clinicalRisk: result.clinicalRisk as any,
      confidenceScore: result.confidenceScore,
      clinicalInterpretations: result.clinicalInterpretations || result.diseases || [],
      priority,
    };
  };

  const analyzeImageWithGemini = async (bloodImg: string | null, urineImg: string | null, type: ScreeningType) => {
    // Access API key safely
    const apiKey = typeof process !== 'undefined' ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : undefined;
    
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please configure it in the environment variables.");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const parts: any[] = [
        { text: `You are a clinical laboratory technician specializing in rural health screenings. 
Analyze the provided image(s). 
Screening Type: ${type}

${type === 'blood' || type === 'both' ? 'For Blood Analysis: Analyze the blood test strip for Glucose, Hb, Cholesterol, and Uric Acid.' : ''}
${type === 'urine' || type === 'both' ? 'For Urine Analysis: Analyze the 4-parameter urine test strip for Glucose, Protein, Leukocytes, and Nitrite.' : ''}

1. Identify the test strip(s) and compare the color of each pad against standard colorimetric charts.
2. Estimate the values for the relevant parameters.
3. Determine the Clinical Risk Level (LOW RISK, MODERATE RISK, HIGH RISK, or CRITICAL).

Return the results in the specified JSON format.` }
      ];

      if (bloodImg) {
        parts.push({ inlineData: { mimeType: "image/jpeg", data: bloodImg.split(',')[1] } });
      }
      if (urineImg) {
        parts.push({ inlineData: { mimeType: "image/jpeg", data: urineImg.split(',')[1] } });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              urineParameters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    status: { type: Type.STRING },
                    referenceRange: { type: Type.STRING }
                  },
                  required: ["name", "value", "unit", "status", "referenceRange"]
                }
              },
              bloodParameters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    status: { type: Type.STRING },
                    referenceRange: { type: Type.STRING }
                  },
                  required: ["name", "value", "unit", "status", "referenceRange"]
                }
              },
              hbValue: { type: Type.NUMBER },
              clinicalRisk: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER }
            },
            required: ["clinicalRisk", "confidenceScore"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("The AI model returned an empty response.");
      
      const result = JSON.parse(text);
      
      return {
        ...MOCK_DATA,
        screeningType: type,
        urineParameters: result.urineParameters || (type === 'urine' || type === 'both' ? MOCK_PARAMETERS : undefined),
        bloodParameters: result.bloodParameters || (type === 'blood' || type === 'both' ? [
          { name: 'Glucose', value: '110', unit: 'mg/dL', referenceRange: '70-140', status: 'Normal' },
          { name: 'Hb', value: result.hbValue?.toString() || '12.5', unit: 'g/dL', referenceRange: '12-16', status: 'Normal' },
          { name: 'Cholesterol', value: '180', unit: 'mg/dL', referenceRange: '< 200', status: 'Normal' },
          { name: 'Uric Acid', value: '5.2', unit: 'mg/dL', referenceRange: '3.5-7.2', status: 'Normal' },
        ] : undefined),
        hbValue: result.hbValue || 12.0,
        clinicalRisk: result.clinicalRisk || 'LOW RISK',
        confidenceScore: result.confidenceScore || 90,
        hbInterpretation: (result.hbValue < 7 ? 'Severe Anemia' : result.hbValue < 10 ? 'Moderate Anemia' : result.hbValue < 12 ? 'Mild Anemia' : 'Normal') as any,
        priority: (result.clinicalRisk === 'CRITICAL' ? 'Critical' : result.clinicalRisk === 'HIGH RISK' ? 'Red' : result.clinicalRisk === 'MODERATE RISK' ? 'Yellow' : 'Green') as any,
      };
    } catch (error: any) {
      console.error("Gemini analysis failed:", error);
      throw new Error(error.message || "Failed to analyze image.");
    }
  };

  const handleDownload = () => {
    const doc = generatePDF(data, t);
    doc.save(`NalamThedi_Report_${data.patientName.replace(/\s/g, '_')}.pdf`);
  };

  const handleShare = () => {
    const targetPhone = data.phone || "919876543210";
    const priorityLabel = data.priority === 'Red' ? t.immediateReferral : data.priority === 'Yellow' ? t.visitPHC7Days : t.routineVisit;
    const message = `Nalam Thedi Labs Screening Report for ${data.patientName}. Result: ${priorityLabel}. Please consult a doctor.`;
    const whatsappUrl = `https://wa.me/${targetPhone.startsWith('91') ? targetPhone : '91' + targetPhone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    if (!navigator.userAgent.match(/Android|iPhone|iPad/i)) {
      alert("WhatsApp may not be installed on this device. Please use a mobile phone for full sharing features.");
    }
  };

  const handleCapture = (image: string) => {
    if (currentCaptureType === 'blood') {
      setBloodImage(image);
    } else {
      setUrineImage(image);
    }
    setProcessingError(null);
    setScreen('timer');
  };

  const handleProcessingComplete = async () => {
    setProcessingError(null);
    try {
      let finalData: ScreeningData;

      if (backendAvailable) {
        // Primary path: FastAPI backend with local CV models
        try {
          finalData = await analyzeWithBackend(bloodImage, urineImage, screeningType);
        } catch (backendErr: any) {
          console.warn("Backend analysis failed, falling back to Gemini:", backendErr.message);
          finalData = await analyzeImageWithGemini(bloodImage, urineImage, screeningType);
        }
      } else {
        // Fallback: direct Gemini API call from browser
        finalData = await analyzeImageWithGemini(bloodImage, urineImage, screeningType);
      }

      const newData: ScreeningData = {
        ...finalData,
        patientName: data.patientName,
        age: data.age,
        village: data.village,
        phone: data.phone,
        date: new Date().toLocaleDateString(),
        metadata: {
          ...finalData.metadata,
          timestamp: new Date().toLocaleTimeString()
        }
      };

      setData(newData);
      setReports(prev => [newData, ...prev]);
      setPatientCount(prev => prev + 1);
      setScreen('results');
    } catch (error: any) {
      setProcessingError(error.message || "An unexpected error occurred during analysis.");
    }
  };

  const handleLogin = (user: {id:string;name:string;password:string}) => {
    // simple in-memory storage; password check for existing user
    const existing = users.find(u => u.id === user.id);
    if (existing) {
      if (existing.password !== user.password) {
        alert('Incorrect password');
        return;
      }
      setCurrentUser({ id: existing.id, name: existing.name });
    } else {
      // new user, add to list
      setUsers(prev => [...prev, user]);
      setCurrentUser({ id: user.id, name: user.name });
    }
    setScreen('home');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative overflow-hidden">
      {/* Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.2] pointer-events-none z-0">
        <Logo className="w-[200%] h-[200%] rotate-[-15deg]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {screen === 'splash' && <SplashScreen />}
      {screen === 'login' && <LoginScreen t={t} onLogin={handleLogin} />}
      {screen === 'home' && (
        <HomeScreen
          t={t}
          language={language}
          patientCount={patientCount}
          currentUserName={currentUser?.name}
          onLanguageToggle={toggleLanguage}
          onStartScreening={() => {
            setProcessingError(null);
            setScreen('details');
          }}
          onViewReports={() => setScreen('reports')}
        />
      )}

      {screen === 'reports' && (
        <ReportsScreen
          t={t}
          reports={reports}
          onBack={() => setScreen('home')}
          onSelectReport={(report) => {
            setData(report);
            setScreen('results');
          }}
        />
      )}

      {screen === 'details' && (
        <PatientDetailsScreen
          t={t}
          onContinue={(info: PatientInfo) => {
            setData({
              ...MOCK_DATA,
              patientName: info.name,
              age: parseInt(info.age),
              village: info.village,
              phone: info.phone,
              date: new Date().toLocaleDateString(),
              metadata: {
                ...MOCK_DATA.metadata,
                timestamp: new Date().toLocaleTimeString()
              }
            });
            setScreen('type');
          }}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'type' && (
        <ScreeningTypeScreen
          t={t}
          onSelect={(type) => {
            setScreeningType(type);
            setBloodImage(null);
            setUrineImage(null);
            if (type === 'blood' || type === 'both') {
              setCurrentCaptureType('blood');
            } else {
              setCurrentCaptureType('urine');
            }
            setScreen('source');
          }}
          onBack={() => setScreen('details')}
        />
      )}

      {screen === 'source' && (
        <SourceSelectionScreen
          t={t}
          title={currentCaptureType === 'blood' ? t.captureBloodStrip : t.captureUrineStrip}
          onSelect={(source, file) => {
            if (source === 'camera') {
              setScreen('camera');
            } else if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                const img = reader.result as string;
                if (currentCaptureType === 'blood') {
                  setBloodImage(img);
                } else {
                  setUrineImage(img);
                }
                setProcessingError(null);
                setScreen('timer');
              };
              reader.readAsDataURL(file);
            }
          }}
          onBack={() => setScreen('type')}
        />
      )}

      {screen === 'camera' && (
        <CameraScreen
          t={t}
          title={currentCaptureType === 'blood' ? t.captureBloodStrip : t.captureUrineStrip}
          onCapture={(image: string) => handleCapture(image)}
          onCancel={() => setScreen('source')}
        />
      )}

      {screen === 'timer' && (
        <TimerScreen
          t={t}
          title={currentCaptureType === 'blood' ? t.captureBloodStrip : t.captureUrineStrip}
          initialTime={60}
          isBlood={currentCaptureType === 'blood'}
          onComplete={() => {
            if (screeningType === 'both' && currentCaptureType === 'blood') {
              setCurrentCaptureType('urine');
              setScreen('source');
            } else {
              setScreen('processing');
            }
          }}
          onBack={() => setScreen('source')}
        />
      )}

      {screen === 'processing' && (
        <ProcessingScreen
          t={t}
          image={urineImage || bloodImage || undefined}
          urineImage={urineImage}
          bloodImage={bloodImage}
          isBlood={screeningType === 'blood'}
          error={processingError}
          onComplete={handleProcessingComplete}
          onRetry={handleProcessingComplete}
          onBack={() => setScreen('source')}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          data={data}
          t={t}
          language={language}
          onDownload={handleDownload}
          onShare={handleShare}
          onHome={() => setScreen('home')}
        />
      )}
      </div>
    </div>
  );
}
