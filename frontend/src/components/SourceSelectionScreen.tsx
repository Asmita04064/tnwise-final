/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Camera, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import { Translation } from '../types';

interface SourceSelectionScreenProps {
  t: Translation;
  title?: string;
  isBlood?: boolean;
  onSelect: (source: 'camera' | 'upload', file?: File) => void;
  onBack: () => void;
}

export default function SourceSelectionScreen({ t, title, isBlood = false, onSelect, onBack }: SourceSelectionScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelect('upload', file);
    }
  };

  return (
    <div className={`min-h-screen ${isBlood ? 'bg-red-50/30' : 'bg-transparent'} flex flex-col p-6 transition-colors duration-500`}>
      <header className="flex items-center mb-10 pt-4">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600">
          <ChevronLeft size={28} />
        </button>
        <div className="ml-2">
          <h1 className="text-2xl font-bold text-slate-800">{title || t.selectSource}</h1>
          <p className={`text-xs font-bold ${isBlood ? 'text-red-600' : 'text-emerald-600'} uppercase tracking-widest`}>
            {t.stepIndicator} 2 of 4
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col space-y-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('camera')}
          className="w-full bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center space-y-4 active:bg-slate-50 transition-all"
        >
          <div className={`${isBlood ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'} p-6 rounded-3xl`}>
            <Camera size={48} />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">{t.useCamera}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center space-y-4 active:bg-slate-50 transition-all"
        >
          <div className={`${isBlood ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'} p-6 rounded-3xl`}>
            <ImageIcon size={48} />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">{t.uploadImage}</span>
        </motion.button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </main>

      <footer className="mt-10 pb-6 text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Tamil Nadu PHC Deployment v1.2
        </p>
      </footer>
    </div>
  );
}
