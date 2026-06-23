'use client';

import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { getStatusCfg } from '@/components/StatusBadge';

const snapshot = [
  { name: 'Fasting Sugar', value: '142', unit: 'mg/dL', status: 'high',       trend: '▲' },
  { name: 'HbA1c',        value: '7.1',  unit: '%',     status: 'critical',   trend: '▲' },
  { name: 'Blood Pressure',value: '120/80',unit: 'mmHg', status: 'normal',    trend: '→' },
  { name: 'Cholesterol',  value: '225',  unit: 'mg/dL', status: 'borderline', trend: '▲' },
];

const recentReports = [
  {
    icon: '📄',
    title: 'Complete Blood Count',
    lab: 'City Lab · Dr. Patel',
    date: '15 Jun 2026',
    preview: 'Sugar: 142 · HbA1c: 7.1',
    abnormal: 3,
  },
  {
    icon: '💊',
    title: 'Prescription — Dr. Shah',
    lab: 'Apollo Pharmacy',
    date: '10 Jun 2026',
    preview: '',
    abnormal: 0,
  },
  {
    icon: '📋',
    title: 'Lipid Profile',
    lab: 'Dr. Reddy\'s Pathology',
    date: '20 May 2026',
    preview: 'Chol: 225 · HDL: 48',
    abnormal: 2,
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const greeting = getGreeting();

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
            YK
          </div>
          <span className="text-sm font-semibold text-gray-800">Yogesh ▾</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">2</span>
          </button>
          <button>
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Greeting */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{greeting}, Yogesh ☀️</h1>
          <p className="text-sm text-gray-500 mt-0.5">3 reports this month</p>
        </div>

        {/* Alert card */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">3 values need attention</p>
            <p className="text-xs text-red-600 mt-0.5">HbA1c: 7.1% · Sugar: 142 · Cholesterol: 225</p>
          </div>
        </div>

        {/* Health Snapshot */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Health Snapshot</h2>
            <Link href="/analytics" className="text-xs text-teal-600 font-medium">See all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {snapshot.map((p) => {
              const c = getStatusCfg(p.status);
              return (
                <div key={p.name} className={`bg-white rounded-xl border border-gray-100 border-l-4 ${c.border} p-3 shadow-sm`}>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{p.name}</p>
                  <p className={`text-lg font-bold font-mono mt-1 ${c.text}`}>
                    {p.value}
                    <span className="text-[10px] font-normal ml-1 text-gray-400">{p.unit}</span>
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs font-medium ${c.text}`}>{c.label}</span>
                    <span className={`text-xs ${c.text}`}>{p.trend}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Link href="/reports" className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">Reports</span>
          </Link>
          <button className="bg-teal-600 rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-xs font-medium text-white">Upload</span>
          </button>
          <Link href="/analytics" className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">Analytics</span>
          </Link>
        </div>

        {/* Recent Reports */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Reports</h2>
            <Link href="/reports" className="text-xs text-teal-600 font-medium">See all →</Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {recentReports.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-lg flex-shrink-0">
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
                  <p className="text-xs text-gray-400 truncate">{r.lab}</p>
                  {r.preview && (
                    <p className="text-xs text-gray-500 mt-0.5">{r.preview}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[10px] text-gray-400">{r.date}</span>
                  {r.abnormal > 0 && (
                    <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                      {r.abnormal} ⚠
                    </span>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Reminder */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 flex items-start gap-3">
          <span className="text-lg">⏰</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-teal-800">HbA1c Test Due</p>
            <p className="text-xs text-teal-600 mt-0.5">📅 25 Jun · In 4 days</p>
          </div>
          <button className="text-xs font-medium text-teal-700 border border-teal-300 rounded-lg px-2.5 py-1.5 bg-white">
            Done
          </button>
        </div>
      </div>

      {/* FAB */}
      <button className="fixed bottom-20 right-4 w-14 h-14 bg-teal-600 rounded-full shadow-lg flex items-center justify-center z-30">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <BottomNav />
    </main>
  );
}
