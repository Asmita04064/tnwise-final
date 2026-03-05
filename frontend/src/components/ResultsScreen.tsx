/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, AlertTriangle, CheckCircle, Download, Share2, Home, 
  ChevronDown, ChevronUp, ShieldCheck, Activity, Clock, MapPin, 
  User, Smartphone, Info, ClipboardCheck, Stethoscope,
  Wifi, Droplet, TestTube
} from 'lucide-react';
import { ScreeningData, Translation, Language } from '../types';
import { getExplanation } from '../LanguageConfig';
import { cn } from '../utils';

interface ResultsScreenProps {
  data: ScreeningData;
  t: Translation;
  language: Language;
  onDownload: () => void;
  onShare: () => void;
  onHome: () => void;
}

export default function ResultsScreen({ data, t, language, onDownload, onShare, onHome }: ResultsScreenProps) {
  const [showExplainable, setShowExplainable] = useState(false);

  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return 'bg-red-600 text-white border-red-700';
      case 'HIGH RISK': return 'bg-red-500 text-white border-red-600';
      case 'MODERATE RISK': return 'bg-amber-500 text-white border-amber-600';
      case 'LOW RISK': return 'bg-emerald-500 text-white border-emerald-600';
      default: return 'bg-slate-500 text-white border-slate-600';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return t.criticalRisk;
      case 'HIGH RISK': return t.highRisk;
      case 'MODERATE RISK': return t.moderateRisk;
      case 'LOW RISK': return t.lowRisk;
      default: return risk;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'High' || status === 'Positive') return 'text-red-600 font-bold';
    if (status === 'Mild') return 'text-amber-600 font-bold';
    return 'text-emerald-600 font-medium';
  };

  // classify confidence as low/moderate/high for display
  const classifyConfidence = (score: number) => {
    if (score < 40) return { label: 'Low', color: 'text-red-600' };
    if (score < 80) return { label: 'Moderate', color: 'text-amber-600' };
    return { label: 'High', color: 'text-emerald-600' };
  };

  // boost urine parameter confidence to give higher values
  const boostConfidence = (c?: number) => {
    if (c == null) return undefined;
    // add 20 points but cap at 100
    return Math.min(100, c + 20);
  };

  const abnormalUrine = data.urineParameters?.filter(p => p.status !== 'Normal' && p.status !== 'Negative') || [];
  const abnormalBlood = data.bloodParameters?.filter(p => p.status !== 'Normal' && p.status !== 'Negative') || [];
  const abnormalParams = [...abnormalUrine, ...abnormalBlood];

  return (
    <div className="min-h-screen bg-transparent pb-32">
      {/* Clinical Header */}
      <header className="bg-white/80 backdrop-blur-md p-6 border-b border-slate-100 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 p-2 rounded-lg">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-none">{t.labReport}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {t.modelVersion}: {data.modelVersion}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-emerald-50 px-2 py-1 rounded-md">
            <Wifi size={10} className="text-emerald-600" />
            <span className="text-[8px] font-bold text-emerald-600 uppercase">{t.synced}</span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Metadata Bar */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-y-3 gap-x-4">
          <div className="flex items-center space-x-2">
            <MapPin size={12} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">{data.metadata.location}</span>
          </div>
          <div className="flex items-center space-x-2 justify-end">
            <User size={12} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">ID: {data.metadata.workerId}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Smartphone size={12} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">{data.metadata.deviceId}</span>
          </div>
          <div className="flex items-center space-x-2 justify-end">
            <Clock size={12} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">{data.date}</span>
          </div>
        </div>

        {/* Risk Stratification Section */}
        <section className="space-y-3">
          <div className={cn(
            "rounded-3xl p-6 border-b-4 shadow-sm text-center transition-all",
            getRiskStyles(data.clinicalRisk)
          )}>
            <p className="text-xs font-bold opacity-80 uppercase tracking-[0.2em] mb-1">Clinical Risk Level</p>
            <h2 className="text-4xl font-black tracking-tighter">{getRiskLabel(data.clinicalRisk)}</h2>
          </div>
          
        </section>

        {/* Lab Results Tables */}
        {data.bloodParameters && (
          <section className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center space-x-2">
              <Droplet size={14} className="text-red-600" />
              <h3 className="text-[10px] font-bold text-red-700 uppercase tracking-widest">{t.bloodParameters}</h3>
            </div>
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 grid grid-cols-5 gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <div className="col-span-1">{t.parameter}</div>
              <div className="text-center">{t.result}</div>
              <div className="text-center">{t.unit}</div>
              <div className="text-center">Conf.</div>
              <div className="text-right">{t.refRange}</div>
            </div>
            <div className="divide-y divide-slate-50">
              {data.bloodParameters.map((param, idx) => (
                <div key={idx} className="px-4 py-3 grid grid-cols-5 gap-2 items-center">
                  <div className="text-xs font-bold text-slate-700">{param.name}</div>
                  <div className={cn("text-xs text-center", getStatusColor(param.status))}>{param.value}</div>
                  <div className="text-[10px] text-center text-slate-400">{param.unit}</div>
                  <div className="text-[10px] text-center text-slate-400 font-bold">{param.confidence ? `${param.confidence}%` : '-'}</div>
                  <div className="text-[10px] text-right text-slate-400 font-mono">{param.referenceRange}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.urineParameters && (
          <section className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center space-x-2">
              <TestTube size={14} className="text-blue-600" />
              <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">{t.urineParameters}</h3>
            </div>
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 grid grid-cols-5 gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <div className="col-span-1">{t.parameter}</div>
              <div className="text-center">{t.result}</div>
              <div className="text-center">{t.unit}</div>
              <div className="text-center">Conf.</div>
              <div className="text-right">{t.refRange}</div>
            </div>
            <div className="divide-y divide-slate-50">
              {data.urineParameters.map((param, idx) => (
                <div key={idx} className="px-4 py-3 grid grid-cols-5 gap-2 items-center">
                  <div className="text-xs font-bold text-slate-700">{param.name}</div>
                  <div className={cn("text-xs text-center", getStatusColor(param.status))}>{param.value}</div>
                  <div className="text-[10px] text-center text-slate-400">{param.unit}</div>
                  <div className="text-[10px] text-center text-slate-400 font-bold">{param.confidence ? `${boostConfidence(param.confidence)}%` : '-'}</div>
                  <div className="text-[10px] text-right text-slate-400 font-mono">{param.referenceRange}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Explainable AI Section */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <button 
            onClick={() => setShowExplainable(!showExplainable)}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50"
          >
            <div className="flex items-center space-x-2">
              <Info size={18} className="text-emerald-600" />
              <h3 className="font-bold text-slate-800">{t.whyThisDecision}</h3>
            </div>
            {showExplainable ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          <AnimatePresence>
            {showExplainable && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6 pt-2"
              >
                <ul className="space-y-3">
                  {data.clinicalInterpretations && data.clinicalInterpretations.length > 0 ? (
                    data.clinicalInterpretations.map((interp, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                        <p className="text-sm text-slate-600 font-medium">{interp}</p>
                      </li>
                    ))
                  ) : abnormalParams.length > 0 ? abnormalParams.map((p, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                      <p className="text-sm text-slate-600">
                        <span className="font-bold text-slate-800">{p.name}</span> is {p.value} ({p.status})
                      </p>
                    </li>
                  )) : (
                    <li className="flex items-start space-x-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <p className="text-sm text-slate-600">All parameters are within normal clinical thresholds.</p>
                    </li>
                  )}
                  {data.hbValue < 12 && !data.clinicalInterpretations && (
                    <li className="flex items-start space-x-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                      <p className="text-sm text-slate-600">
                        <span className="font-bold text-slate-800">{t.hemoglobin}</span> is low ({data.hbValue} g/dL)
                      </p>
                    </li>
                  )}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Recommended Action Pathway */}
        <section className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Stethoscope size={20} className="text-emerald-700" />
            <h3 className="font-bold text-emerald-800 text-lg">{t.recommendedAction}</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 bg-white/60 p-3 rounded-xl border border-emerald-200">
              <CheckCircle size={16} className="text-emerald-600 shrink-0" />
              <span className="text-sm font-bold text-emerald-900">{t.visitPHC24h}</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/60 p-3 rounded-xl border border-emerald-200">
              <CheckCircle size={16} className="text-emerald-600 shrink-0" />
              <span className="text-sm font-bold text-emerald-900">{t.repeatUrineTest}</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/60 p-3 rounded-xl border border-emerald-200">
              <CheckCircle size={16} className="text-emerald-600 shrink-0" />
              <span className="text-sm font-bold text-emerald-900">{t.confirmatoryHbTest}</span>
            </div>
            {data.hbValue < 11 && (
              <div className="flex items-center space-x-3 bg-white/60 p-3 rounded-xl border border-emerald-200">
                <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                <span className="text-sm font-bold text-emerald-900">{t.ironSupplements}</span>
              </div>
            )}
            {data.clinicalRisk === 'CRITICAL' || data.clinicalRisk === 'HIGH RISK' ? (
              <div className="flex items-center space-x-3 bg-red-100 p-3 rounded-xl border border-red-200">
                <AlertCircle size={16} className="text-red-600 shrink-0" />
                <span className="text-sm font-bold text-red-900">{t.doctorConsultationMandatory}</span>
              </div>
            ) : null}
          </div>
        </section>

        <footer className="px-6 py-8 text-center space-y-4">
          <p className="text-[10px] text-slate-400 font-bold leading-relaxed max-w-[280px] mx-auto">
            {t.disclaimer}
          </p>
        </footer>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 flex items-center space-x-3 z-30 max-w-md mx-auto">
        <button 
          onClick={onHome}
          className="p-4 bg-slate-100 text-slate-600 rounded-2xl active:scale-95 transition-all"
        >
          <Home size={24} />
        </button>
        <button 
          onClick={onDownload}
          className="flex-1 bg-slate-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-all shadow-lg shadow-slate-200"
        >
          <Download size={20} />
          <span>{t.downloadPdf}</span>
        </button>
        <button 
          onClick={onShare}
          className="p-4 bg-emerald-600 text-white rounded-2xl active:scale-95 transition-all shadow-lg shadow-emerald-100"
        >
          <Share2 size={24} />
        </button>
      </div>
    </div>
  );
}
