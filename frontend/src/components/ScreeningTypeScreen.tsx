import React from 'react';
import { Translation } from '../types';
import { Droplet, TestTube, Layers, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface ScreeningTypeScreenProps {
  t: Translation;
  onSelect: (type: 'urine' | 'blood' | 'both') => void;
  onBack: () => void;
}

export default function ScreeningTypeScreen({ t, onSelect, onBack }: ScreeningTypeScreenProps) {
  return (
    <div className="min-h-screen bg-transparent flex flex-col p-6">
      <header className="flex items-center mb-10 pt-4">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 ml-2">{t.selectScreeningType}</h1>
      </header>

      <div className="flex-1 flex flex-col space-y-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('urine')}
          className="w-full bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center space-x-6 active:bg-slate-50 transition-all"
        >
          <div className="bg-blue-50 p-4 rounded-2xl">
            <TestTube className="text-blue-600" size={32} />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-slate-800">{t.urineAnalysis}</h2>
            <p className="text-sm text-slate-500">(Glucose, Protein...)</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('blood')}
          className="w-full bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center space-x-6 active:bg-slate-50 transition-all"
        >
          <div className="bg-red-50 p-4 rounded-2xl">
            <Droplet className="text-red-600" size={32} />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-slate-800">{t.bloodAnalysis}</h2>
            <p className="text-sm text-slate-500">Hb, Anemia...</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('both')}
          className="w-full bg-emerald-600 p-8 rounded-[2.5rem] shadow-lg flex items-center space-x-6 active:bg-emerald-700 transition-all"
        >
          <div className="bg-white/20 p-4 rounded-2xl">
            <Layers className="text-white" size={32} />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-white">{t.bothAnalysis}</h2>
            <p className="text-sm text-emerald-100">Comprehensive screening</p>
          </div>
        </motion.button>
      </div>

      <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
        <p className="text-xs text-slate-500 leading-relaxed text-center">
          {t.disclaimer}
        </p>
      </div>
    </div>
  );
}
