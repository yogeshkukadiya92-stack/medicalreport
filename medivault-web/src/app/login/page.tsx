'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api/auth';

type Step = 'phone' | 'otp' | 'loading';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authAPI.sendOTP(phone.trim());
      setStep('otp');
    } catch (err: any) {
      setError(err?.message ?? 'OTP send karva ma problem aavi. Dobara try karo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authAPI.verifyOTP(phone.trim(), otp.trim());
      setStep('loading');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'OTP invalid che. Dobara try karo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl shadow-lg mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MediVault</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'phone' ? 'Phone number thi login karo' : `OTP moklayu ${phone} par`}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Country code sathe lakho: +91xxxxxxxx</p>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={busy || !phone}
                className="w-full py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {busy ? 'OTP moklayi rahyu...' : 'OTP Moklo'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  6-digit OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm tracking-widest text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={busy || otp.length < 6}
                className="w-full py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {busy ? 'Verify thai rahyu...' : 'Verify & Login'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); setOtp(''); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-teal-600 transition"
              >
                ← Phone number badlo
              </button>
            </form>
          )}

          {step === 'loading' && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">Dashboard kholai rahyu che...</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Tamara medical records safe ane private rahese.
        </p>
      </div>
    </main>
  );
}
