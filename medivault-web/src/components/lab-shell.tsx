"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { AuthSetupRequired, SessionLoading } from "@/components/auth-gate";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/mobile-shell";
import { SignOutButton } from "@/components/sign-out-button";

const labNav = [
  { href: "/lab", icon: "analytics", label: "Dashboard" },
  { href: "/lab/clients", icon: "family", label: "Clients" },
  { href: "/lab/create", icon: "upload", label: "Create report" },
  { href: "/lab/reports", icon: "reports", label: "History" },
  { href: "/lab/templates", icon: "shield", label: "Templates" },
  { href: "/lab/settings", icon: "home", label: "Settings" },
] as const;

export function LabShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isConfigLoading, isConfigured, status } = useAuth();
  const requiresProductionAuth = process.env.NODE_ENV === "production";

  useEffect(() => {
    if (isConfigured && status === "unauthenticated") {
      const queryString = typeof window === "undefined" ? "" : window.location.search;
      const nextPath = `${pathname}${queryString}`;
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [isConfigured, pathname, router, status]);

  if (isConfigLoading) {
    return <SessionLoading />;
  }

  if (!isConfigured && requiresProductionAuth) {
    return <AuthSetupRequired surface="lab dashboard" />;
  }

  if (isConfigured && (status === "loading" || status === "unauthenticated")) {
    return <SessionLoading />;
  }

  return (
    <main className="min-h-screen bg-[#eef3f1] text-[#101c1c]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col lg:flex-row">
        <aside className="border-b border-[#dce9e5] bg-white px-4 py-4 lg:min-h-screen lg:w-[260px] lg:border-b-0 lg:border-r lg:px-5">
          <div className="flex items-center justify-between gap-3 lg:block">
            <Link href="/lab" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#102323] text-[#99f0db]">
                <Icon name="shield" className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[15px] font-black text-[#102323]">MediVault Lab</span>
                <span className="block text-[12px] font-bold text-[#6f7f7c]">Structured reports</span>
              </span>
            </Link>
            <div className="lg:hidden">
              <SignOutButton />
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
            {labNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-11 min-w-max items-center gap-3 rounded-lg px-3 text-[13px] font-bold ${
                    isActive ? "bg-[#0a7d6e] text-white" : "text-[#52605d] hover:bg-[#f1f6f4] hover:text-[#102323]"
                  }`}
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 hidden lg:block">
            <SignOutButton />
            <Link href="/dashboard" className="mt-3 flex h-10 items-center justify-center rounded-lg border border-[#dce9e5] text-[12px] font-bold text-[#52605d]">
              Client app
            </Link>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</section>
      </div>
    </main>
  );
}
