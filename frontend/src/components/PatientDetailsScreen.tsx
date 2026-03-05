/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, ArrowRight, ChevronLeft, MapPin, Calendar, Mic, AlertCircle } from 'lucide-react';
import { Translation, PatientInfo } from '../types';

interface PatientDetailsScreenProps {
  t: Translation;
  onContinue: (info: PatientInfo) => void;
  onBack: () => void;
}

export default function PatientDetailsScreen({ t, onContinue, onBack }: PatientDetailsScreenProps) {
  const [info, setInfo] = useState<PatientInfo>({
    name: '',
    age: '',
    village: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PatientInfo, boolean>>>({});
  const [largeMode, setLargeMode] = useState(false);

  const [isListening, setIsListening] = useState<keyof PatientInfo | null>(null);

  const startSpeechRecognition = (field: keyof PatientInfo) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Default to Indian English, can be adjusted
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(field);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInfo(prev => ({ ...prev, [field]: transcript }));
      setIsListening(null);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access is blocked. Please enable microphone permissions in your browser settings to use voice input.');
      }
      setIsListening(null);
    };

    recognition.onend = () => {
      setIsListening(null);
    };

    recognition.start();
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof PatientInfo, boolean>> = {};
    if (!info.name) newErrors.name = true;
    if (!info.age) newErrors.age = true;
    if (!info.village) newErrors.village = true;
    if (info.phone.length < 10) newErrors.phone = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onContinue(info);
    }
  };

  const isFormValid = info.name && info.age && info.village && info.phone.length >= 10;

  return (
    <div className="min-h-screen bg-transparent flex flex-col p-6">
      <header className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600">
            <ChevronLeft size={28} />
          </button>
          <div className="ml-2">
            <h1 className="text-2xl font-bold text-slate-800">{t.patientDetails}</h1>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              {t.stepIndicator} 1 of 3
            </p>
          </div>
        </div>
        <button 
          onClick={() => setLargeMode(!largeMode)}
          className="text-[10px] font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase tracking-tighter"
        >
          {largeMode ? 'Standard UI' : 'Large UI'}
        </button>
      </header>

      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t.patientName} <span className="text-red-500">*</span>
                </label>
                {errors.name && <span className="text-[10px] text-red-500 font-bold">{t.requiredField}</span>}
              </div>
              <div className="relative flex items-center">
                <div className="relative flex-1">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={largeMode ? 24 : 20} />
                  <input
                    type="text"
                    value={info.name}
                    onChange={(e) => setInfo({ ...info, name: e.target.value })}
                    placeholder={t.namePlaceholder}
                    className={`w-full bg-slate-50 border ${errors.name ? 'border-red-300' : 'border-slate-200'} rounded-2xl ${largeMode ? 'py-6 text-xl' : 'py-4 text-base'} pl-12 pr-4 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => startSpeechRecognition('name')}
                  className={`ml-2 p-3 ${isListening === 'name' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'} rounded-2xl active:bg-emerald-100 transition-all`}
                >
                  <Mic size={largeMode ? 24 : 20} />
                </button>
              </div>
            </div>

            {/* Age */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t.age} <span className="text-red-500">*</span>
                </label>
                {errors.age && <span className="text-[10px] text-red-500 font-bold">{t.requiredField}</span>}
              </div>
              <div className="relative flex items-center">
                <div className="relative flex-1">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={largeMode ? 24 : 20} />
                  <input
                    type="number"
                    value={info.age}
                    onChange={(e) => setInfo({ ...info, age: e.target.value })}
                    placeholder={t.agePlaceholder}
                    className={`w-full bg-slate-50 border ${errors.age ? 'border-red-300' : 'border-slate-200'} rounded-2xl ${largeMode ? 'py-6 text-xl' : 'py-4 text-base'} pl-12 pr-4 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => startSpeechRecognition('age')}
                  className={`ml-2 p-3 ${isListening === 'age' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'} rounded-2xl active:bg-emerald-100 transition-all`}
                >
                  <Mic size={largeMode ? 24 : 20} />
                </button>
              </div>
            </div>

            {/* Village */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t.village} <span className="text-red-500">*</span>
                </label>
                {errors.village && <span className="text-[10px] text-red-500 font-bold">{t.requiredField}</span>}
              </div>
              <div className="relative flex items-center">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={largeMode ? 24 : 20} />
                  <input
                    type="text"
                    value={info.village}
                    onChange={(e) => setInfo({ ...info, village: e.target.value })}
                    placeholder={t.villagePlaceholder}
                    className={`w-full bg-slate-50 border ${errors.village ? 'border-red-300' : 'border-slate-200'} rounded-2xl ${largeMode ? 'py-6 text-xl' : 'py-4 text-base'} pl-12 pr-4 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => startSpeechRecognition('village')}
                  className={`ml-2 p-3 ${isListening === 'village' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'} rounded-2xl active:bg-emerald-100 transition-all`}
                >
                  <Mic size={largeMode ? 24 : 20} />
                </button>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  WhatsApp Number <span className="text-red-500">*</span>
                </label>
                {errors.phone && <span className="text-[10px] text-red-500 font-bold">Invalid Number</span>}
              </div>
              <div className="relative flex items-center">
                <div className="relative flex-1">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold ${largeMode ? 'text-xl' : 'text-base'}`}>+91</span>
                  <input
                    type="tel"
                    value={info.phone}
                    onChange={(e) => setInfo({ ...info, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder={t.phonePlaceholder}
                    className={`w-full bg-slate-50 border ${errors.phone ? 'border-red-300' : 'border-slate-200'} rounded-2xl ${largeMode ? 'py-6 text-xl' : 'py-4 text-base'} pl-14 pr-4 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => startSpeechRecognition('phone')}
                  className={`ml-2 p-3 ${isListening === 'phone' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'} rounded-2xl active:bg-emerald-100 transition-all`}
                >
                  <Mic size={largeMode ? 24 : 20} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full bg-emerald-600 text-white font-bold ${largeMode ? 'py-6 text-xl' : 'py-4 text-base'} rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all mt-8`}
            >
              <span>{t.continue}</span>
              <ArrowRight size={largeMode ? 24 : 20} />
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
