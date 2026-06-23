'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { getStatusCfg } from '@/components/StatusBadge';
import UploadSheet from '@/components/UploadSheet';
import { reportsAPI } from '@/lib/api/reports';
import { profileAPI } from '@/lib/api/profile';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import type { HealthSummary, Profile } from '@/lib/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

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

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Dashboard() {
  const authChecking = useRequireAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [s, p] = await Promise.all([
        reportsAPI.getHealthSummary(),
        profileAPI.getProfile(),
      ]);
      setSummary(s);
      setProfile(p);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Could not load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authChecking) load();
  }, [authChecking, load]);

  if (authChecking) return <Spinner />;

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const initials = profile?.full_name
    ?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  const snapshotItems = summary?.attention_items?.slice(0, 4) ?? [];
  const recentReports = summary?.recent_reports?.slice(0, 3) ?? [];

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold select-none">
            {loading ? '…' : initials}
          </div>
          <span className="text-sm font-semibold text-gray-800">
            {loading ? '' : (profile?.full_name || 'My Health')}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={load} className="text-xs font-semibold text-red-700 underline ml-3 flex-shrink-0">Retry</button>
          </div>
        )}

        {/* Greeting */}
        {loading ? (
          <div className="space-y-2 pt-1">
            <div className="h-6 w-52 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-36 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-bold text-gray-900">{greeting()}, {firstName} ☀️</h1>
            <p className="text-sm text-gray-500 mt-0.5">{summary?.total_reports ?? 0} total report{(summary?.total_reports ?? 0) !== 1 ? 's' : ''}</p>
          </div>
        )}

        {/* Attention alert */}
        {!loading && (summary?.values_needing_attention ?? 0) > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800">
                {summary!.values_needing_attention} value{summary!.values_needing_attention > 1 ? 's' : ''} need attention
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {summary!.attention_items
                  .slice(0, 3)
                  .map((i) => `${i.parameter_name}: ${i.value}${i.unit ? ' ' + i.unit : ''}`)
                  .join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* Health Snapshot */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Health Snapshot</h2>
            <Link href="/analytics" className="text-xs text-teal-600 font-medium">See all →</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-[88px] animate-pulse" />
              ))}
            </div>
          ) : snapshotItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-400">No values yet. Upload a report to see your health snapshot.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {snapshotItems.map((p) => {
                const c = getStatusCfg(p.status);
                return (
                  <div key={p.id} className={`bg-white rounded-xl border border-gray-100 border-l-4 ${c.border} p-3 shadow-sm`}>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide truncate">{p.parameter_name}</p>
                    <p className={`text-lg font-bold font-mono mt-1 leading-tight ${c.text}`}>
                      {p.value}
                      {p.unit && <span className="text-[10px] font-normal ml-0.5 text-gray-400">{p.unit}</span>}
                    </p>
                    <span className={`text-xs font-medium ${c.text}`}>{c.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Link href="/reports" className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">Reports</span>
          </Link>
          <button onClick={() => setUploadOpen(true)} className="bg-teal-600 rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-md">
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
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-40 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-28 bg-gray-50 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentReports.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-4xl mb-2">📂</p>
              <p className="text-sm font-medium text-gray-600">No reports yet</p>
              <p className="text-xs text-gray-400 mt-1">Tap + to upload your first report</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {recentReports.map((r) => {
                const abnormal = r.extracted_values?.filter((v) => v.status !== 'normal').length ?? 0;
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-lg flex-shrink-0">
                      {reportIcon(r.report_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {r.report_title || r.report_type || 'Report'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {[r.lab_name, r.doctor_name].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-gray-400">{fmt(r.report_date || r.created_at)}</span>
                      {abnormal > 0 && (
                        <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                          {abnormal} ⚠
                        </span>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
