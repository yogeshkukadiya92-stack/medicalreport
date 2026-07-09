"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";

type Mode = "signin" | "signup";

function safeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  try {
    const url = new URL(value, "https://medivault.local");
    if (url.origin !== "https://medivault.local") return "/dashboard";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { isConfigLoading, isConfigured, login, signup, status } = useAuth();
  const [redirectPath] = useState(() => {
    if (typeof window === "undefined") return "/dashboard";
    return safeRedirectPath(new URLSearchParams(window.location.search).get("next"));
  });
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(redirectPath);
    }
  }, [redirectPath, router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isConfigured) {
      setError("MongoDB is not configured yet.");
      return;
    }

    if (!phone || !password) {
      setError("Enter mobile number and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        await login(phone, password);
      } else {
        if (!email) {
          setError("Enter email address for signup.");
          return;
        }
        if (!isOtpSent) {
          setError("Tap Send OTP first.");
          return;
        }
        if (otp.trim() !== "1111") {
          setError("Invalid OTP. Use 1111 for testing.");
          return;
        }
        await signup({ email, otp, password, phone });
      }
      router.replace(redirectPath);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "We couldn't reach the authentication service. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSendOtp() {
    setError("");
    setMessage("");

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid mobile number before sending OTP.");
      return;
    }
    if (!email) {
      setError("Enter email address before sending OTP.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Enter a password with at least 6 characters before sending OTP.");
      return;
    }

    setIsOtpSent(true);
    setMessage("Testing OTP sent. Use 1111 to verify this mobile number.");
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setOtp("");
    setIsOtpSent(false);
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
          Sign in with your mobile number to keep family reports, health trends, and upload history private.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg border border-[#dce9e5] bg-white p-1">
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={`h-10 rounded-md text-[13px] font-bold ${mode === "signin" ? "bg-[#102323] text-white" : "text-[#65716f]"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`h-10 rounded-md text-[13px] font-bold ${mode === "signup" ? "bg-[#102323] text-white" : "text-[#65716f]"}`}
          >
            Create account
          </button>
        </div>

        {!isConfigLoading && !isConfigured ? (
          <div className="mt-5 rounded-lg border border-[#f0d4ca] bg-[#fff7f4] p-4">
            <p className="text-[13px] font-black text-[#ba563d]">MongoDB env missing</p>
            <p className="mt-2 text-[13px] leading-5 text-[#65716f]">
              Add MONGODB_URI and MONGODB_DB locally and on Railway.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-[12px] font-bold text-[#52605d]">Mobile number</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="9876543210"
              inputMode="tel"
              autoComplete="tel"
              className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] bg-white px-4 text-[14px] font-semibold text-[#162523] outline-none focus:border-[#0a7d6e]"
            />
          </label>

          {mode === "signup" ? (
            <label className="block">
              <span className="text-[12px] font-bold text-[#52605d]">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] bg-white px-4 text-[14px] font-semibold text-[#162523] outline-none focus:border-[#0a7d6e]"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-[12px] font-bold text-[#52605d]">Password</span>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="h-12 w-full rounded-lg border border-[#dce9e5] bg-white py-0 pl-4 pr-12 text-[14px] font-semibold text-[#162523] outline-none focus:border-[#0a7d6e]"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-[#52605d] hover:bg-[#f1f6f4] hover:text-[#102323]"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
                    <path d="M3.8 12.1s3-5.8 8.2-5.8 8.2 5.8 8.2 5.8-3 5.8-8.2 5.8-8.2-5.8-8.2-5.8Z" />
                    <path d="M14.1 10a3 3 0 0 1-4.1 4.1" />
                    <path d="m4.5 4.5 15 15" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
                    <path d="M3.8 12.1s3-5.8 8.2-5.8 8.2 5.8 8.2 5.8-3 5.8-8.2 5.8-8.2-5.8-8.2-5.8Z" />
                    <path d="M12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {mode === "signup" ? (
            <div className="rounded-lg border border-[#dce9e5] bg-[#f7fbfa] p-3">
              <div className="flex items-end gap-2">
                <label className="min-w-0 flex-1">
                  <span className="text-[12px] font-bold text-[#52605d]">Mobile OTP</span>
                  <input
                    type="text"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="1111"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    disabled={!isOtpSent}
                    className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] bg-white px-4 text-[16px] font-black tracking-[0.28em] text-[#162523] outline-none focus:border-[#0a7d6e] disabled:bg-[#edf3f1] disabled:text-[#8a9794]"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="h-12 shrink-0 rounded-lg bg-[#102323] px-4 text-[12px] font-black text-white"
                >
                  {isOtpSent ? "Resend" : "Send OTP"}
                </button>
              </div>
              <p className="mt-2 text-[12px] font-semibold leading-5 text-[#65716f]">
                SMS provider is not connected yet. For testing, every mobile number uses OTP 1111.
              </p>
            </div>
          ) : null}

          {error ? <p className="rounded-lg bg-[#fff0ec] p-3 text-[13px] font-bold text-[#ba563d]">{error}</p> : null}
          {message ? <p className="rounded-lg bg-[#eaf9f2] p-3 text-[13px] font-bold text-[#087766]">{message}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting || isConfigLoading || !isConfigured}
            className="h-12 w-full rounded-lg bg-[#0a7d6e] text-[14px] font-black text-white shadow-[0_14px_30px_rgba(10,125,110,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConfigLoading ? "Checking setup" : isSubmitting ? "Please wait" : mode === "signin" ? "Sign in with mobile" : "Verify OTP & create account"}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-[#f7fbfa] p-4">
          <p className="text-[12px] font-bold text-[#087766]">Protected by MongoDB sessions</p>
          <p className="mt-2 text-[12px] leading-5 text-[#65716f]">
            Signup verifies mobile with test OTP 1111. Login uses mobile number and password.
          </p>
        </div>
      </section>
    </main>
  );
}
