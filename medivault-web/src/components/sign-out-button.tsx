"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

export function SignOutButton() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
    router.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-label="Logout"
      title={isSigningOut ? "Signing out" : "Logout"}
      className="grid h-11 w-11 place-items-center rounded-lg border border-[#dce9e5] bg-white text-[#223230] shadow-[0_8px_24px_rgba(20,67,60,0.08)] disabled:opacity-60"
    >
      {isSigningOut ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#dce9e5] border-t-[#0a7d6e]" />
      ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
          <path d="M12 4.8v6.4" />
          <path d="M7.6 7.7a7 7 0 1 0 8.8 0" />
        </svg>
      )}
    </button>
  );
}
