'use client';

import { useState, useEffect, useCallback } from 'react';
import BottomNav from '@/components/BottomNav';
import { getStatusCfg } from '@/components/StatusBadge';
import { reportsAPI } from '@/lib/api/reports';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import type { HealthSummary, ExtractedValue } from '@/lib/types';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const TIME_RANGES = ['3M', '6M', '1Y', 'All'];

function calcScore(items: ExtractedValue[]): number {
  let score = 100;
  for (const v of items) {
    if (v.status === 'critical') score -= 15;
    else if (v.status === 'high' || v.status === 'low') score -= 8;
    else if (v.status === 'borderline') score -= 4;
  }
  return Math.max(0, score);
}

function scoreLabel(s: number) {
  if (s >= 80) return 'Good';
  if (s >= 60) return 'Fair';
  if (s >= 40) return 'Poor';
  return 'Critical';
}

function scoreColor(s: number) {
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#f59e0b';
  return '#ef4444';
}

export default function Analytics() {
  const authChecking = useRequireAuth();
  const [range, setRange] = useState('3M');
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reportsAPI.getHealthSummary();
      setSummary(data);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (!authChecking) load();
  }, [authChecking, load]);

  if (authChecking) return <Spinner />;

  const items = summary?.attention_items ?? [];
  const score = calcScore(items);
  const circumference = 2 * Math.PI * 38;
  const filled = (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Analytics</h1>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={load} className="text-xs font-semibold text-red-700 underline ml-3 flex-shrink-0">Retry</button>
          </div>
        )}

        {/* Time range chips */}
        <div className="flex gap-2">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition ${
                range === r ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Health Score */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-28 animate-pulse" />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-5">
            <svg width="90" height="90" viewBox="0 0 90 90" className="flex-shrink-0 -rotate-90">
              <circle cx="45" cy="45" r="38" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="45" cy="45" r="38"
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeDasharray={`${filled} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Health Score</p>
              <p className="text-4xl font-bold text-gray-900 mt-0.5">{score}</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color }}>{scoreLabel(score)}</p>
              <p className="text-xs text-gray-400 mt-1">
                Based on {summary?.total_reports ?? 0} report{(summary?.total_reports ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Parameters */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
            Values Needing Attention
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
              {(summary?.total_reports ?? 0) === 0 ? (
                <>
                  <p className="text-5xl mb-3">📊</p>
                  <p className="text-base font-semibold text-gray-700">No data yet</p>
                  <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                    Upload at least one report to see your analytics here.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-5xl mb-3">✅</p>
                  <p className="text-base font-semibold text-gray-700">All values are normal</p>
                  <p className="text-sm text-gray-400 mt-1">Great job! No values need attention right now.</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((p) => {
                const c = getStatusCfg(p.status);
                return (
                  <div key={p.id} className={`bg-white rounded-xl border border-gray-100 border-l-4 ${c.border} p-4 shadow-sm`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{p.parameter_name}</p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className={`text-2xl font-bold font-mono ${c.text}`}>{p.value}</span>
                          {p.unit && <span className="text-xs text-gray-400">{p.unit}</span>}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        {c.label}
                      </span>
                    </div>
                    {p.reference_range_text && (
                      <p className="text-xs text-gray-400 mt-2">Normal: {p.reference_range_text}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
