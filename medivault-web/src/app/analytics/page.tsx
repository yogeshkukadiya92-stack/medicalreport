'use client';

import { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import { getStatusCfg } from '@/components/StatusBadge';

const timeRanges = ['3M', '6M', '1Y', 'All'];

const parameters = [
  { name: 'HbA1c',           value: '7.1',  unit: '%',     status: 'critical',   trend: '▲', change: '+0.3', insight: 'Increasing trend — consult your doctor.' },
  { name: 'Fasting Sugar',   value: '142',  unit: 'mg/dL', status: 'high',       trend: '▲', change: '+12',  insight: 'Elevated. Monitor daily glucose levels.' },
  { name: 'Total Cholesterol',value: '225', unit: 'mg/dL', status: 'borderline', trend: '→', change: '+5',   insight: 'Borderline. Reduce saturated fats.' },
  { name: 'Vitamin D',       value: '18',   unit: 'ng/mL', status: 'low',        trend: '↓', change: '-2',   insight: 'Low. Consider supplementation.' },
  { name: 'Hemoglobin',      value: '14.2', unit: 'g/dL',  status: 'normal',     trend: '→', change: '0.0',  insight: 'Within normal range.' },
  { name: 'TSH',             value: '2.1',  unit: 'mIU/L', status: 'normal',     trend: '→', change: '-0.1', insight: 'Thyroid levels are stable.' },
];

const score = 72;

export default function Analytics() {
  const [range, setRange] = useState('3M');
  const circumference = 2 * Math.PI * 38;
  const filled = (score / 100) * circumference;

  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Poor';

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Analytics</h1>
        <button className="text-sm text-teal-600 font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Time range chips */}
        <div className="flex gap-2">
          {timeRanges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition ${
                range === r
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Health Score */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-5">
          <svg width="90" height="90" viewBox="0 0 90 90" className="flex-shrink-0 -rotate-90">
            <circle cx="45" cy="45" r="38" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="45" cy="45" r="38"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeDasharray={`${filled} ${circumference}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Health Score</p>
            <p className="text-4xl font-bold text-gray-900 mt-0.5">{score}</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: scoreColor }}>{scoreLabel}</p>
            <p className="text-xs text-gray-400 mt-1">Based on 12 reports</p>
          </div>
        </div>

        {/* Parameter cards */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Parameters</h2>
          <div className="space-y-3">
            {parameters.map((p) => {
              const c = getStatusCfg(p.status);
              return (
                <div key={p.name} className={`bg-white rounded-xl border border-gray-100 border-l-4 ${c.border} p-4 shadow-sm`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{p.name}</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className={`text-2xl font-bold font-mono ${c.text}`}>{p.value}</span>
                        <span className="text-xs text-gray-400">{p.unit}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        {c.label}
                      </span>
                      <span className={`text-xs font-medium ${c.text}`}>{p.trend} {p.change}</span>
                    </div>
                  </div>
                  {p.status !== 'normal' && (
                    <p className="text-xs text-gray-500 mt-2 border-t border-gray-50 pt-2">{p.insight}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Track new */}
        <button className="w-full border border-dashed border-teal-300 rounded-xl py-3 text-sm font-medium text-teal-600 bg-teal-50">
          + Track New Parameter
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
