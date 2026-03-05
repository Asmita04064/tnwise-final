/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, FileText, Calendar, User, MapPin, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { ScreeningData, Translation } from '../types';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { useState } from 'react';

interface ReportsScreenProps {
  t: Translation;
  reports: ScreeningData[];
  onBack: () => void;
  onSelectReport: (report: ScreeningData) => void;
}

export default function ReportsScreen({ t, reports, onBack, onSelectReport }: ReportsScreenProps) {
  const [showGlobalTrends, setShowGlobalTrends] = useState(false);

  const firstReportWithHistory = reports.find(r => r.history && r.history.length > 0);

  return (
    <div className="min-h-screen bg-transparent flex flex-col p-6">
      <header className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600">
            <ChevronLeft size={28} />
          </button>
          <h1 className="text-2xl font-bold text-slate-800 ml-2">{t.previousReports}</h1>
        </div>
        {reports.length > 0 && (
          <button 
            onClick={() => setShowGlobalTrends(!showGlobalTrends)}
            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl active:scale-95 transition-all"
          >
            <BarChart3 size={24} />
          </button>
        )}
      </header>

      <main className="flex-1 space-y-6">
        <AnimatePresence>
          {showGlobalTrends && firstReportWithHistory && (
            <motion.section
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 overflow-hidden"
            >
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{t.viewHealthTrends}</h3>
              <div className="space-y-8">
                <div className="h-40 w-full">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Aggregate Hemoglobin Trend</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={firstReportWithHistory.history}>
                      <Line type="monotone" dataKey="hb" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669' }} />
                      <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis domain={[8, 14]} hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#64748b' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="h-40 w-full">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Infection Flag History</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={firstReportWithHistory.history}>
                      <Bar dataKey="infectionFlags">
                        {firstReportWithHistory.history?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.infectionFlags > 0 ? '#ef4444' : '#10b981'} />
                        ))}
                      </Bar>
                      <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis hide />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText size={64} className="mb-4 opacity-20" />
              <p>{t.noReports}</p>
            </div>
          ) : (
            reports.map((report, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onSelectReport(report)}
                className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      report.priority === 'Critical' || report.priority === 'Red' ? 'bg-red-500' : 
                      report.priority === 'Yellow' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="font-bold text-slate-800">{report.patientName}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md">
                    {report.date}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <User size={14} />
                      <span>{report.age} yrs</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <MapPin size={14} />
                      <span>{report.village}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <Calendar size={14} className="text-slate-500" />
                      <span className="font-bold text-slate-700">Hb: {report.hbValue} g/dL</span>
                    </div>
                  </div>

                  {report.history && (
                    <div className="h-16 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={report.history}>
                          <Line 
                            type="monotone" 
                            dataKey="hb" 
                            stroke="#059669" 
                            strokeWidth={2} 
                            dot={{ r: 2, fill: '#059669' }} 
                          />
                          <XAxis dataKey="date" hide />
                          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="flex items-center justify-center space-x-1 text-[8px] text-emerald-600 font-bold uppercase mt-1">
                        <TrendingUp size={10} />
                        <span>Hb Trend</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {report.history && (
                  <div className="border-t border-slate-50 pt-3 mt-1">
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      <span>{report.history[0].date}</span>
                      <span>Recent: {report.history[report.history.length - 1].date}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
