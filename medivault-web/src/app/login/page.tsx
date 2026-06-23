'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api/auth';

type View = 'signin' | 'signup' | 'forgot' | 'forgot-sent' | 'verify-email';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function resetForm() {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setShowPass(false);
    setShowConfirm(false);
  }

  function switchTo(v: View) {
    resetForm();
    setView(v);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authAPI.signIn(email.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Sign in failed. Check your email and password.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const data = await authAPI.signUp(email.trim(), password);
      if (data.user && !data.session) {
        // Email confirmation required
        setView('verify-email');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Sign up failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setView('forgot-sent');
    } catch (err: any) {
      setError(err?.message ?? 'Could not send reset link. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
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
          <p className="text-sm text-gray-500 mt-1">Your health records, organised and secure.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

          {/* ── Sign In ── */}
          {view === 'signin' && (
            <>
              {/* Tab switcher */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
                <button className="flex-1 py-1.5 rounded-lg text-sm font-semibold bg-white text-gray-900 shadow-sm">
                  Sign In
                </button>
                <button
                  onClick={() => switchTo('signup')}
                  className="flex-1 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => switchTo('forgot')}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={busy || !email || !password}
                  className="w-full py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {busy ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            </>
          )}

          {/* ── Sign Up ── */}
          {view === 'signup' && (
            <>
              <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
                <button
                  onClick={() => switchTo('signin')}
                  className="flex-1 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Sign In
                </button>
                <button className="flex-1 py-1.5 rounded-lg text-sm font-semibold bg-white text-gray-900 shadow-sm">
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={busy || !email || !password || !confirmPassword}
                  className="w-full py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {busy ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            </>
          )}

          {/* ── Verify email notice ── */}
          {view === 'verify-email' && (
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-900">Verify your email</h2>
              <p className="text-sm text-gray-500 mt-2">
                We sent a confirmation link to <span className="font-medium text-gray-800">{email}</span>. Open it to activate your account.
              </p>
              <button
                onClick={() => switchTo('signin')}
                className="mt-5 w-full py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* ── Forgot Password ── */}
          {view === 'forgot' && (
            <>
              <button
                onClick={() => switchTo('signin')}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <h2 className="text-base font-bold text-gray-900 mb-1">Forgot password?</h2>
              <p className="text-sm text-gray-500 mb-5">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={busy || !email}
                  className="w-full py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {busy ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          {/* ── Forgot Password — sent ── */}
          {view === 'forgot-sent' && (
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-900">Check your email</h2>
              <p className="text-sm text-gray-500 mt-2">
                A password reset link was sent to{' '}
                <span className="font-medium text-gray-800">{email}</span>.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Didn't receive it? Check your spam folder.
              </p>
              <button
                onClick={() => switchTo('signin')}
                className="mt-5 w-full py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
              >
                Back to Sign In
              </button>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your medical records are private and encrypted.
        </p>
      </div>
    </main>
  );
}
