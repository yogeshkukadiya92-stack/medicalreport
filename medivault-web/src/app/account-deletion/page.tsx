"use client";

import { useState, type FormEvent } from "react";

export default function AccountDeletionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleted, setDeleted] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!confirmed || busy) return;
    setBusy(true); setError("");
    try {
      const login = await fetch("/api/auth/mobile", { method: "POST", credentials: "omit", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login", phone: email.trim(), password }) });
      const session = await login.json();
      if (!login.ok || !session.accessToken) throw new Error(session.error || "Sign-in failed.");
      const response = await fetch("/api/auth/account", { method: "DELETE", credentials: "omit", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` }, body: JSON.stringify({ password, confirmation: "DELETE" }) });
      const result = await response.json();
      if (!response.ok || !result.deleted) throw new Error(result.error || "Deletion could not finish. Please retry.");
      setDeleted(true); setPassword("");
    } catch (e) { setError(e instanceof Error ? e.message : "Connection failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-[#edf4f2] px-5 py-12 text-[#162523]">
    <section className="mx-auto max-w-[520px] rounded-2xl bg-white p-7 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-[#087766]">MediVault Health Records</p>
      <h1 className="mt-3 text-2xl font-black">Delete your account</h1>
      {deleted ? <p role="status" className="mt-5 leading-7">Your MediVault account, uploaded files, family vault and share links have been deleted. You no longer need the app to complete this request.</p> : <>
        <p className="mt-4 text-sm leading-6">You can delete your account here without reinstalling the app. This permanently removes your MediVault login, family vault, files you uploaded, share links and associated account activity. The issuing clinic retains its independent clinical records. Organization-managed accounts must first transfer or close their organization.</p>
        <p className="mt-3 text-sm leading-6">You can also use Privacy &amp; Security → Account deletion inside the app.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-bold">Email or mobile number<input required autoComplete="username" className="mt-2 w-full rounded-xl border border-[#dbe6e3] p-3 font-normal" value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label className="block text-sm font-bold">Password<input required type="password" autoComplete="current-password" className="mt-2 w-full rounded-xl border border-[#dbe6e3] p-3 font-normal" value={password} onChange={e => setPassword(e.target.value)} /></label>
          <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" />I understand this permanently deletes my account and uploaded data and cannot be undone.</label>
          {error ? <p role="alert" className="text-sm text-[#ba563d]">{error}</p> : null}
          <button disabled={busy || !confirmed || !email.trim() || !password} className="w-full rounded-xl bg-[#a6352c] p-3 font-bold text-white disabled:opacity-50">{busy ? "Deleting account..." : "Permanently delete my account"}</button>
        </form>
      </>}
    </section>
  </main>;
}
