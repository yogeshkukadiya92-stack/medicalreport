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
  { href: "/admin", icon: "trend", label: "Admin" },
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
    <main className="min-h-screen bg-[#f2f6f5] text-[#17222b]">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="border-b border-[#dce9e5] bg-[#064e3b] px-4 py-3 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[216px] lg:flex-col lg:border-b-0 lg:border-r-0 lg:px-3 lg:py-4">
          <div className="flex items-center justify-between gap-3 lg:block">
            <Link href="/lab" className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md border border-white/15 bg-white/10 text-[#7ce7d2]">
                <Icon name="shield" className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[14px] font-black text-white">MediVault <span className="text-[#5eead4]">Lab</span></span>
                <span className="block text-[10px] font-bold text-white/55">Clinical operations</span>
              </span>
            </Link>
            <div className="lg:hidden">
              <SignOutButton />
            </div>
          </div>

          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:mt-6 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {labNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/lab" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-9 min-w-max items-center gap-3 rounded-md px-3 text-[12px] font-bold ${
                    isActive ? "bg-[#14b8a6] text-[#052e2b] shadow-[inset_3px_0_0_#99f6e4]" : "text-white/72 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto hidden border-t border-white/12 pt-4 lg:block">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#5eead4]">Current workspace</p>
            <p className="mt-1.5 text-[12px] font-black text-white">Pathologist admin</p>
            <p className="mt-0.5 text-[10px] font-semibold text-white/55">Main lab · Ahmedabad</p>
          </div>

          <div className="mt-3 hidden lg:block">
            <SignOutButton />
            <Link href="/dashboard" className="mt-2 flex h-9 items-center justify-center rounded-md border border-white/15 text-[11px] font-bold text-white/70 hover:bg-white/10 hover:text-white">
              Client app
            </Link>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-3 py-4 sm:px-5 lg:px-6 lg:py-5">{children}</section>
      </div>
    </main>
  );
}
