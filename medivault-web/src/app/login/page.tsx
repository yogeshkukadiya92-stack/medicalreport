"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Supabase environment variables are missing.");
      return;
    }

    if (!email || !password) {
      setError("Enter email and password.");
      return;
    }

    setIsSubmitting(true);

    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
            },
          });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Check your email to confirm, then sign in.");
      return;
    }

    router.replace("/dashboard");
  }

  async function sendMagicLink() {
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Supabase environment variables are missing.");
      return;
    }

    if (!email) {
      setError("Enter your email first.");
      return;
    }

    setIsSubmitting(true);
    const { error: magicError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
      },
    });
    setIsSubmitting(false);

    if (magicError) {
      setError(magicError.message);
      return;
    }

    setMessage("Magic link sent. Open it from your email to continue.");
  }

  return (
    <main className="min-h-screen bg-[#eef3f1] px-5 py-8 text-[#101c1c] md:flex md:items-center md:justify-center">
      <section className="mx-auto min-h-[calc(100vh-64px)] w-full max-w-[430px] overflow-hidden rounded-[28px] bg-[#fbfdfc] p-5 shadow-[0_24px_80px_rgba(10,31,31,0.18)] md:min-h-[760px]">
        <div className="mt-2 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-[#087766]">MediVault</p>
            <h1 className="mt-2 text-[30px] font-black leading-tight">Secure health login</h1>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-lg bg-[#102323] text-white shadow-[0_18px_38px_rgba(16,35,35,0.2)]">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
              <path d="M12 3.8 18.5 6v5.6c0 4.2-2.7 7.1-6.5 8.6-3.8-1.5-6.5-4.4-6.5-8.6V6L12 3.8Z" />
              <path d="m9.4 12 1.8 1.8 3.7-4" />
            </svg>
          </div>
        </div>

        <p className="mt-4 text-[14px] leading-6 text-[#65716f]">
          Sign in to keep family reports, health trends, and upload history private.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg border border-[#dce9e5] bg-white p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`h-10 rounded-md text-[13px] font-bold ${mode === "signin" ? "bg-[#102323] text-white" : "text-[#65716f]"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`h-10 rounded-md text-[13px] font-bold ${mode === "signup" ? "bg-[#102323] text-white" : "text-[#65716f]"}`}
          >
            Create
          </button>
        </div>

        {!isSupabaseConfigured ? (
          <div className="mt-5 rounded-lg border border-[#f0d4ca] bg-[#fff7f4] p-4">
            <p className="text-[13px] font-black text-[#ba563d]">Supabase env missing</p>
            <p className="mt-2 text-[13px] leading-5 text-[#65716f]">
              Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY locally and on Railway.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-[12px] font-bold text-[#52605d]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] bg-white px-4 text-[14px] font-semibold text-[#162523] outline-none focus:border-[#0a7d6e]"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-bold text-[#52605d]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
              className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] bg-white px-4 text-[14px] font-semibold text-[#162523] outline-none focus:border-[#0a7d6e]"
            />
          </label>

          {error ? <p className="rounded-lg bg-[#fff0ec] p-3 text-[13px] font-bold text-[#ba563d]">{error}</p> : null}
          {message ? <p className="rounded-lg bg-[#eaf9f2] p-3 text-[13px] font-bold text-[#087766]">{message}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting || !isSupabaseConfigured}
            className="h-12 w-full rounded-lg bg-[#0a7d6e] text-[14px] font-black text-white shadow-[0_14px_30px_rgba(10,125,110,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Please wait" : mode === "signin" ? "Sign in securely" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={sendMagicLink}
          disabled={isSubmitting || !isSupabaseConfigured}
          className="mt-3 h-12 w-full rounded-lg border border-[#dce9e5] bg-white text-[14px] font-black text-[#102323] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send magic link
        </button>

        <div className="mt-6 rounded-lg bg-[#f7fbfa] p-4">
          <p className="text-[12px] font-bold text-[#087766]">Protected by Supabase Auth</p>
          <p className="mt-2 text-[12px] leading-5 text-[#65716f]">
            Sessions persist automatically and refresh in the background.
          </p>
        </div>
      </section>
    </main>
  );
}
