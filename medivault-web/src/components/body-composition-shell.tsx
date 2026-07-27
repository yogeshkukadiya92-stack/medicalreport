"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AuthSetupRequired, SessionLoading, WorkspaceAccessDenied } from "@/components/auth-gate";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/mobile-shell";
import { useWorkspaceAccess } from "@/components/use-workspace-access";

const navigation = [
  { href: "/body-composition", icon: "analytics", label: "Dashboard" },
  { href: "/body-composition/clients", icon: "family", label: "Clients" },
  { href: "/body-composition/create", icon: "upload", label: "Add scan" },
  { href: "/body-composition/imports", icon: "reports", label: "Review inbox" },
  { href: "/body-composition/reports", icon: "reports", label: "History" },
  { href: "/body-composition/analytics", icon: "trend", label: "Analytics" },
] as const;

export function BodyCompositionShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isConfigLoading, isConfigured, signOut, status, user } = useAuth();
  const workspaceAccess = useWorkspaceAccess("body_composition");
  const [isOpeningLogin, setIsOpeningLogin] = useState(false);

  useEffect(() => {
    if (isConfigured && status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isConfigured, pathname, router, status]);

  if (isConfigLoading || (isConfigured && (status === "loading" || status === "unauthenticated")) || (status === "authenticated" && workspaceAccess.loading)) {
    return <SessionLoading />;
  }
  if (!isConfigured && process.env.NODE_ENV === "production") {
    return <AuthSetupRequired surface="body composition center" />;
  }
  if (isConfigured && status === "authenticated" && !workspaceAccess.allowed) {
    return <WorkspaceAccessDenied workspace="Body Composition dashboard" />;
  }

  async function openLogin() {
    setIsOpeningLogin(true);
    if (status === "authenticated") await signOut();
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }

  return (
    <main className="min-h-screen bg-[#f3f7f6] text-[#17222b]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-[#dbe6e3] bg-[#102f35] px-4 py-3 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[224px] lg:flex-col lg:border-b-0 lg:px-3 lg:py-4">
          <div className="flex items-center justify-between gap-3 lg:block">
            <Link href="/body-composition" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-[#d9f4ec] text-[#075b4e]">
                <Icon name="trend" className="h-5 w-5" />
              </span>
              <span><span className="block text-[14px] font-black">MediVault Body</span><span className="block text-[10px] font-bold text-white/55">Composition center</span></span>
            </Link>
            <button
              type="button"
              onClick={openLogin}
              disabled={isOpeningLogin}
              className="h-9 rounded-md border border-white/20 px-3 text-[10px] font-black text-white lg:hidden"
            >
              {isOpeningLogin ? "Opening..." : status === "authenticated" ? "Switch login" : "Sign in"}
            </button>
          </div>

          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:mt-6 lg:block lg:space-y-1 lg:overflow-visible">
            {navigation.map((item) => {
              const active = pathname === item.href || (item.href !== "/body-composition" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={`flex h-9 min-w-max items-center gap-3 rounded-md px-3 text-[12px] font-bold ${active ? "bg-[#55d6b3] text-[#102f35]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
                  <Icon name={item.icon} className="h-4 w-4" />{item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto hidden border-t border-white/12 pt-4 lg:block">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#74e7c8]">Connected system</p>
            <p className="mt-1.5 text-[12px] font-black">Patient app sync</p>
            <p className="mt-0.5 text-[10px] font-semibold text-white/55">Verified scans only</p>
            <Link href="/lab" className="mt-3 flex h-9 items-center justify-center rounded-md border border-white/15 text-[10px] font-black text-white/70 hover:bg-white/10">Lab dashboard</Link>
            <Link href="/dashboard" className="mt-2 flex h-9 items-center justify-center rounded-md border border-white/15 text-[10px] font-black text-white/70 hover:bg-white/10">Patient app</Link>
            <div className="mt-3 rounded-md border border-white/12 bg-white/5 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#74e7c8]">Account</p>
              <p className="mt-1.5 truncate text-[10px] font-bold text-white/70">{user?.email || user?.phone || "Not signed in"}</p>
              <button
                type="button"
                onClick={openLogin}
                disabled={isOpeningLogin}
                className="mt-2 flex h-9 w-full items-center justify-center rounded-md bg-[#55d6b3] px-3 text-[10px] font-black text-[#102f35] disabled:opacity-60"
              >
                {isOpeningLogin ? "Opening login..." : status === "authenticated" ? "Switch account" : "Sign in"}
              </button>
            </div>
          </div>
        </aside>
        <section className="min-w-0 flex-1 px-3 py-4 sm:px-5 lg:px-6 lg:py-5">{children}</section>
      </div>
    </main>
  );
}
