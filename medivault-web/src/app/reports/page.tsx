'use client';

import { useState } from 'react';
import BottomNav from '@/components/BottomNav';

const filters = ['All', 'Blood', 'Thyroid', 'Lipid', 'Scan', 'Prescription'];

const reports = [
  {
    icon: '🧪',
    title: 'Blood Test Report',
    lab: 'City Lab · Dr. Patel',
    date: '15 Jun 2026',
    month: 'JUNE 2026',
    preview: 'Sugar: 142 · HbA1c: 7.1',
    abnormal: 3,
    category: 'Blood',
  },
  {
    icon: '💊',
    title: 'Prescription — Dr. Shah',
    lab: 'Apollo Pharmacy',
    date: '10 Jun 2026',
    month: 'JUNE 2026',
    preview: '',
    abnormal: 0,
    category: 'Prescription',
  },
  {
    icon: '🦴',
    title: 'X-Ray — Left Knee',
    lab: 'Radiology Center',
    date: '5 Jun 2026',
    month: 'JUNE 2026',
    preview: '',
    abnormal: 0,
    category: 'Scan',
  },
  {
    icon: '🧬',
    title: 'Thyroid Panel',
    lab: 'Path Lab',
    date: '28 May 2026',
    month: 'MAY 2026',
    preview: 'TSH: 3.5 · T3: 1.2',
    abnormal: 0,
    category: 'Thyroid',
  },
  {
    icon: '🧪',
    title: 'Lipid Profile',
    lab: 'City Lab',
    date: '20 May 2026',
    month: 'MAY 2026',
    preview: 'Chol: 225 · HDL: 48',
    abnormal: 2,
    category: 'Lipid',
  },
];

export default function Reports() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = reports.filter((r) => {
    const matchesSearch =
      search === '' ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.lab.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'All' || r.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const grouped = filtered.reduce<Record<string, typeof reports>>((acc, r) => {
    if (!acc[r.month]) acc[r.month] = [];
    acc[r.month].push(r);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Reports</h1>
        <div className="flex items-center gap-3">
          <button>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-100 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                activeFilter === f
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center justify-end">
          <span className="text-xs text-gray-500">Sort: <span className="font-medium text-gray-700">Newest first ▾</span></span>
        </div>

        {/* Grouped list */}
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-gray-700">No reports found</p>
            <p className="text-sm text-gray-400 mt-1">Try different keywords or remove filters</p>
            <button onClick={() => { setSearch(''); setActiveFilter('All'); }} className="mt-3 text-sm text-teal-600 font-medium">
              Clear filters
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{month}</p>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {items.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-xl flex-shrink-0">
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
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
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
