/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import Logo from './Logo';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-white/90 flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center flex flex-col items-center justify-center w-full"
      >
        <Logo className="w-2/3 max-w-[400px] h-auto mb-6" />
        <h1 className="text-4xl font-bold text-slate-900 mb-2">NALAM THEDI LAB</h1>
        <p className="text-slate-500 font-medium tracking-wide">
          Affordable AI Screening for Rural Women
        </p>
      </motion.div>
      <div className="absolute bottom-12">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
