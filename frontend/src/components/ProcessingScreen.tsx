/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Translation } from '../types';
import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface ProcessingScreenProps {
  t: Translation;
  image?: string;
  urineImage?: string | null;
  bloodImage?: string | null;
  isBlood?: boolean;
  error?: string | null;
  onComplete: () => void;
  onRetry?: () => void;
  onBack?: () => void;
}

export default function ProcessingScreen({ t, image, urineImage, bloodImage, isBlood = false, error, onComplete, onRetry, onBack }: ProcessingScreenProps) {
  const [step, setStep] = useState(0);
  const steps = [
    'Image quality validation...',
    'Lighting calibration check...',
    'Neural network strip detection...',
    'Colorimetric parameter extraction...',
    'Clinical risk stratification...',
    'Generating diagnostic support report...'
  ];

  const hasBothImages = urineImage && bloodImage;

  useEffect(() => {
    if (error) return;

    const timer = setInterval(() => {
      setStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(timer);
          setTimeout(onComplete, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(timer);
  }, [onComplete, steps.length, error]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center space-y-6 max-w-xs"
        >
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-2">
            <AlertCircle size={40} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Analysis Failed</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              {error || "We encountered an error while processing the image. Please ensure the strip is clearly visible and try again."}
            </p>
          </div>

          <div className="flex flex-col w-full space-y-3 pt-4">
            <button
              onClick={onRetry}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
            >
              <RefreshCw size={20} />
              <span>Retry Analysis</span>
            </button>
            
            <button
              onClick={onBack}
              className="w-full bg-slate-50 text-slate-600 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 border border-slate-100 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} />
              <span>Go Back</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderProcessingImage = (img: string, label?: string, colorClass?: string) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`w-full h-full rounded-3xl overflow-hidden border-4 border-slate-50 shadow-xl relative ${colorClass || ''}`}
    >
      <img src={img} alt="Processing" className="w-full h-full object-cover" />
      <div className={`absolute inset-0 ${isBlood || label === 'Blood' ? 'bg-red-600/20' : 'bg-emerald-600/20'} mix-blend-overlay animate-pulse`} />
      <motion.div
        animate={{ y: [0, 192, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className={`absolute top-0 left-0 right-0 h-1 ${isBlood || label === 'Blood' ? 'bg-red-400 shadow-[0_0_15px_rgba(248,113,113,0.8)]' : 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]'} z-10`}
      />
      {label && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">{label}</span>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className={`fixed inset-0 ${isBlood ? 'bg-red-50/10' : 'bg-white'} flex flex-col items-center justify-center p-8 z-50 transition-colors duration-500`}>
      <div className="absolute top-12 left-0 right-0 text-center">
        <p className={`text-xs font-bold ${isBlood ? 'text-red-600' : 'text-emerald-600'} uppercase tracking-widest mb-1`}>
          {t.stepIndicator} 4 of 4
        </p>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">{t.processing}</h2>
      </div>

      <div className={`relative ${hasBothImages ? 'w-full max-w-sm h-48 flex space-x-4' : 'w-48 h-48'} mb-10`}>
        {hasBothImages ? (
          <>
            <div className="flex-1 h-full">
              {renderProcessingImage(bloodImage, 'Blood')}
            </div>
            <div className="flex-1 h-full">
              {renderProcessingImage(urineImage, 'Urine')}
            </div>
          </>
        ) : (
          image ? (
            renderProcessingImage(image)
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className={`absolute inset-0 border-4 border-slate-100 ${isBlood ? 'border-t-red-600' : 'border-t-emerald-600'} rounded-full`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-24 h-24 ${isBlood ? 'bg-red-50' : 'bg-emerald-50'} rounded-full flex items-center justify-center`}
                >
                  <div className={`w-12 h-12 ${isBlood ? 'bg-red-600 shadow-red-100' : 'bg-emerald-600 shadow-emerald-100'} rounded-full shadow-lg`} />
                </motion.div>
              </div>
            </div>
          )
        )}
      </div>
      
      <div className="w-full max-w-xs bg-slate-100 h-1.5 rounded-full overflow-hidden mb-8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
          className={`h-full ${isBlood ? 'bg-red-600' : 'bg-emerald-600'}`}
        />
      </div>

      <div className="h-12 text-center px-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-slate-500 font-bold text-sm uppercase tracking-wide"
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>
      </div>

      <footer className="absolute bottom-12 text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          AI Diagnostic Engine v1.2
        </p>
      </footer>
    </div>
  );
}
