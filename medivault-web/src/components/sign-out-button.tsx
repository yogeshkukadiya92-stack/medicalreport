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
      className="h-11 rounded-lg border border-[#dce9e5] bg-white px-3 text-[12px] font-bold text-[#223230] shadow-[0_8px_24px_rgba(20,67,60,0.08)] disabled:opacity-60"
    >
      {isSigningOut ? "Signing out" : "Logout"}
    </button>
  );
}
