/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Play, CheckCircle, ChevronLeft } from 'lucide-react';
import { Translation } from '../types';

interface TimerScreenProps {
  t: Translation;
  title?: string;
  initialTime?: number;
  isBlood?: boolean;
  onComplete: () => void;
  onBack: () => void;
}

export default function TimerScreen({ t, title, initialTime = 90, isBlood = false, onComplete, onBack }: TimerScreenProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      onComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const progress = ((initialTime - timeLeft) / initialTime) * 100;

  return (
    <div className={`min-h-screen ${isBlood ? 'bg-red-50/30' : 'bg-transparent'} flex flex-col p-6 transition-colors duration-500`}>
      <header className="flex items-center mb-10 pt-4">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600">
          <ChevronLeft size={28} />
        </button>
        <div className="ml-2">
          <h1 className="text-2xl font-bold text-slate-800">{title || t.dipAndPlace}</h1>
          <p className={`text-xs font-bold ${isBlood ? 'text-red-600' : 'text-emerald-600'} uppercase tracking-widest`}>
            {t.stepIndicator} 3 of 4
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center space-y-12">
        <div className="text-center space-y-4 px-6">
          <p className="text-slate-500 font-medium leading-relaxed">
            {t.timerInstruction}
          </p>
        </div>

        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Progress Circle */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-slate-100"
            />
            <motion.circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray="754"
              animate={{ strokeDashoffset: 754 - (754 * progress) / 100 }}
              className={isBlood ? "text-red-600" : "text-emerald-600"}
            />
          </svg>

          <div className="text-center">
            <span className="text-6xl font-black text-slate-800 tracking-tighter">
              {timeLeft}
            </span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {t.secondsRemaining}
            </p>
          </div>
        </div>

        {!isActive ? (
          <div className="flex flex-col items-center space-y-4 w-full px-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsActive(true)}
              className={`w-full ${isBlood ? 'bg-red-600 shadow-red-100' : 'bg-emerald-600 shadow-emerald-100'} text-white py-5 rounded-3xl font-black flex items-center justify-center space-x-3 shadow-xl`}
            >
              <Play fill="white" size={20} />
              <span className="uppercase tracking-widest text-sm">{t.startTimer}</span>
            </motion.button>
            
            <button
              onClick={onComplete}
              className="text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
            >
              {t.skip}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6 w-full px-10">
            <div className={`flex items-center space-x-2 ${isBlood ? 'text-red-600' : 'text-emerald-600'} font-bold animate-pulse`}>
              <Clock size={20} />
              <span className="uppercase tracking-widest text-xs">Timer Active</span>
            </div>
            
            <button
              onClick={onComplete}
              className="text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
            >
              {t.skip}
            </button>
          </div>
        )}
      </main>

      <footer className="mt-10 pb-6 text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Diagnostics Protocol v1.2
        </p>
      </footer>
    </div>
  );
}
