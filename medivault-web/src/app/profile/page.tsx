'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { profileAPI } from '@/lib/api/profile';
import { authAPI } from '@/lib/api/auth';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import type { Profile } from '@/lib/types';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMMON_CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Thyroid', 'Arthritis'];

export default function ProfilePage() {
  const authChecking = useRequireAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState('');

  const load = useCallback(async () => {
    try {
      const p = await profileAPI.getProfile();
      setProfile(p);
      setFullName(p.full_name || '');
      setDob(p.date_of_birth || '');
      setGender(p.gender || '');
      setBloodGroup(p.blood_group || '');
      setConditions(p.known_conditions || []);
    } catch {
      // 404 = no profile yet, start fresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authChecking) load();
  }, [authChecking, load]);

  if (authChecking) return <Spinner />;

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  function toggleCondition(c: string) {
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function addCustomCondition() {
    const val = conditionInput.trim();
    if (val && !conditions.includes(val)) {
      setConditions((prev) => [...prev, val]);
    }
    setConditionInput('');
  }

  async function handleSave() {
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload = {
        full_name: fullName.trim(),
        date_of_birth: dob || undefined,
        gender: gender || undefined,
        blood_group: bloodGroup || undefined,
        known_conditions: conditions,
      };
      if (profile) {
        await profileAPI.updateProfile(payload);
      } else {
        await profileAPI.createProfile(payload);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authAPI.logout();
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Profile</h1>
        {saved && (
          <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
            Saved
          </span>
        )}
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full bg-teal-600 flex items-center justify-center text-white text-2xl font-bold select-none">
            {loading ? '…' : initials}
          </div>
          {!loading && (
            <p className="text-sm text-gray-500">
              {profile ? 'Edit your profile' : 'Set up your profile'}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-14 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {/* Full Name */}
              <div className="px-4 py-3">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full mt-1 text-sm text-gray-900 bg-transparent focus:outline-none placeholder-gray-300"
                />
              </div>

              {/* Date of Birth */}
              <div className="px-4 py-3">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full mt-1 text-sm text-gray-900 bg-transparent focus:outline-none"
                />
              </div>

              {/* Gender */}
              <div className="px-4 py-3">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-2">
                  Gender
                </label>
                <div className="flex gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(gender === g ? '' : g)}
                      className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition ${
                        gender === g ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blood Group */}
              <div className="px-4 py-3">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-2">
                  Blood Group
                </label>
                <div className="flex flex-wrap gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      onClick={() => setBloodGroup(bloodGroup === bg ? '' : bg)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        bloodGroup === bg ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Known Conditions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-3">
                Known Conditions
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_CONDITIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleCondition(c)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      conditions.includes(c)
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {conditions.includes(c) ? '✓ ' : ''}{c}
                  </button>
                ))}
              </div>
              {/* Custom conditions */}
              {conditions.filter((c) => !COMMON_CONDITIONS.includes(c)).map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-medium px-2.5 py-1 rounded-full mr-2 mb-2"
                >
                  {c}
                  <button onClick={() => toggleCondition(c)} className="text-teal-400 hover:text-teal-700">×</button>
                </span>
              ))}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={conditionInput}
                  onChange={(e) => setConditionInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomCondition()}
                  placeholder="Add custom condition…"
                  className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <button
                  onClick={addCustomCondition}
                  className="px-3 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 bg-teal-600 text-white font-semibold rounded-2xl shadow-md disabled:opacity-60 transition"
            >
              {saving ? 'Saving…' : profile ? 'Save Changes' : 'Create Profile'}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full py-3 text-sm font-semibold text-red-600 bg-red-50 rounded-2xl transition disabled:opacity-60"
            >
              {loggingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
