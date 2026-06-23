'use client';

import { useState, useEffect, useCallback } from 'react';
import BottomNav from '@/components/BottomNav';
import UploadSheet from '@/components/UploadSheet';
import { reportsAPI } from '@/lib/api/reports';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import type { MedicalReport } from '@/lib/types';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const FILTER_TYPES = ['All', 'Blood Test', 'Thyroid', 'Lipid', 'Urine', 'X-Ray', 'Prescription', 'Other'];

function reportIcon(type?: string) {
  const t = (type || '').toLowerCase();
  if (t.includes('blood') || t.includes('cbc')) return '🧪';
  if (t.includes('thyroid')) return '🧬';
  if (t.includes('lipid') || t.includes('cholesterol')) return '💉';
  if (t.includes('prescription')) return '💊';
  if (t.includes('xray') || t.includes('x-ray') || t.includes('scan')) return '🦴';
  if (t.includes('urine')) return '🔬';
  return '📄';
}

function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function monthKey(d?: string) {
  if (!d) return 'Unknown Date';
  return new Date(d).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }).toUpperCase();
}

export default function Reports() {
  const authChecking = useRequireAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportsAPI.listReports({ per_page: 50 });
      setReports(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authChecking) load();
  }, [authChecking, load]);

  if (authChecking) return <Spinner />;

  const visible = reports.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (r.report_title || '').toLowerCase().includes(q) ||
      (r.report_type || '').toLowerCase().includes(q) ||
      (r.lab_name || '').toLowerCase().includes(q) ||
      (r.doctor_name || '').toLowerCase().includes(q);
    const matchFilter =
      filter === 'All' ||
      (r.report_type || '').toLowerCase().includes(filter.toLowerCase());
    return matchSearch && matchFilter;
  });

  const grouped = visible.reduce<Record<string, MedicalReport[]>>((acc, r) => {
    const key = monthKey(r.report_date || r.created_at);
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center">
        <h1 className="text-lg font-bold text-gray-900">Reports</h1>
      </div>

      <div className="px-4 pt-3 space-y-3">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={load} className="text-xs font-semibold text-red-700 underline ml-3 flex-shrink-0">Retry</button>
          </div>
        )}

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
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TYPES.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filter === f ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-[76px] animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty states */}
        {!loading && reports.length === 0 && !error && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">📂</p>
            <p className="text-base font-semibold text-gray-700">No reports yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
              Upload your first medical report and we'll extract the data for you.
            </p>
            <button
              onClick={() => setUploadOpen(true)}
              className="mt-5 px-6 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl shadow-md"
            >
              Upload Report
            </button>
          </div>
        )}

        {!loading && reports.length > 0 && visible.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-gray-700">No reports found</p>
            <p className="text-sm text-gray-400 mt-1">Try different keywords or filters</p>
            <button
              onClick={() => { setSearch(''); setFilter('All'); }}
              className="mt-3 text-sm text-teal-600 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Grouped list */}
        {!loading &&
          Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{month}</p>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {items.map((r) => {
                  const abnormal = r.extracted_values?.filter((v) => v.status !== 'normal').length ?? 0;
                  const preview = r.extracted_values?.slice(0, 3).map((v) => `${v.parameter_name}: ${v.value}`).join(' · ');
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-xl flex-shrink-0">
                        {reportIcon(r.report_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {r.report_title || r.report_type || 'Report'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {[r.lab_name, r.doctor_name].filter(Boolean).join(' · ') || '—'}
                        </p>
                        {preview && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{preview}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px] text-gray-400">{fmt(r.report_date || r.created_at)}</span>
                        {abnormal > 0 && (
                          <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                            {abnormal} ⚠
                          </span>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setUploadOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-teal-600 rounded-full shadow-lg flex items-center justify-center z-30"
        aria-label="Upload report"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <UploadSheet open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={load} />
      <BottomNav />
    </main>
  );
}
