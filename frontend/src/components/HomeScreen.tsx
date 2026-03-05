/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Play, FileText, Info, Globe, Activity, Users, ClipboardCheck, Heart, AlertCircle } from 'lucide-react';
import { Translation, Language } from '../types';
import Logo from './Logo';

interface HomeScreenProps {
  t: Translation;
  language: Language;
  patientCount: number;
  currentUserName?: string | null;
  onLanguageToggle: () => void;
  onStartScreening: () => void;
  onViewReports: () => void;
}

export default function HomeScreen({ t, language, patientCount, currentUserName, onLanguageToggle, onStartScreening, onViewReports }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-transparent flex flex-col p-6">
      <header className="flex justify-between items-center mb-10 pt-4">
        <div className="flex items-center space-x-3">
          <Logo className="w-16 h-16" />
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter leading-tight">{t.appName}</h1>
            {currentUserName && (
              <p className="text-sm text-slate-500">Welcome, {currentUserName}</p>
            )}
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Community Diagnostics</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <button
            onClick={onLanguageToggle}
            className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl text-sm font-bold text-slate-600 active:scale-95 transition-all"
          >
            <Globe size={16} />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>
          <div className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <p className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">
              {t.patientCount}: <span className="text-sm">{patientCount}</span>
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-8">
        <section className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartScreening}
            className="w-full bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-emerald-100 flex items-center justify-between group transition-all"
          >
            <div className="text-left">
              <h2 className="text-2xl font-black mb-1">{t.startScreening}</h2>
              <p className="text-emerald-100 text-xs font-medium opacity-80">AI-Powered Diagnostic Support</p>
            </div>
            <div className="bg-white/20 p-4 rounded-full group-hover:bg-white/30 transition-colors">
              <Play fill="white" size={24} />
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewReports}
            className="w-full bg-white text-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center space-x-4"
          >
            <div className="bg-slate-50 p-4 rounded-2xl text-slate-600">
              <FileText size={24} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold">{t.viewReports}</h3>
              <p className="text-slate-400 text-xs font-medium">Access historical patient data</p>
            </div>
          </motion.button>
        </section>

        {/* Impact Summary Section */}
        <section className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.impactSummary}</h3>
            <div className="flex items-center space-x-1 bg-emerald-100 px-2 py-0.5 rounded-md">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[8px] font-bold text-emerald-700 uppercase">Live</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
              <Users size={16} className="text-emerald-600 mb-2" />
              <p className="text-xl font-black text-slate-800">284</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">{t.totalScreenings}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
              <AlertCircle size={16} className="text-red-500 mb-2" />
              <p className="text-xl font-black text-slate-800">54</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">{t.highRiskIdentified}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
              <ClipboardCheck size={16} className="text-blue-500 mb-2" />
              <p className="text-xl font-black text-slate-800">86</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">{t.referralsGenerated}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
              <Heart size={16} className="text-pink-500 mb-2" />
              <p className="text-xl font-black text-slate-800">70</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">{t.anemiaCasesFlagged}</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-6 border border-slate-100">
          <div className="flex items-center space-x-2 mb-3">
            <Info size={18} className="text-emerald-600" />
            <h3 className="font-bold text-slate-800">{t.about}</h3>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">
            {t.aboutText}
          </p>
        </section>
      </main>

      <footer className="mt-10 pb-6 text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Tamil Nadu PHC Deployment v1.2
        </p>
      </footer>
    </div>
  );
}
