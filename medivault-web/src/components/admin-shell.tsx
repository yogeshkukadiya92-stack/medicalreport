"use client";

import Link from "next/link";
import { FormEvent, type ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthSetupRequired, SessionLoading } from "@/components/auth-gate";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/mobile-shell";
import { SignOutButton } from "@/components/sign-out-button";

const adminNav = [
  { href: "/admin", icon: "analytics" as const, label: "Overview", exact: true },
  { href: "/admin/clients", icon: "family" as const, label: "Clients" },
  { href: "/admin/reports", icon: "reports" as const, label: "Reports" },
  { href: "/admin/tasks", icon: "calendar" as const, label: "Tasks" },
];

const workspaceLinks = [
  { href: "/lab", icon: "shield" as const, label: "Lab operations" },
  { href: "/nutrition", icon: "trend" as const, label: "Nutrition CRM" },
  { href: "/dashboard", icon: "home" as const, label: "Patient app" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isConfigLoading, isConfigured, status, user } = useAuth();
  const [search, setSearch] = useState("");
  const requiresProductionAuth = process.env.NODE_ENV === "production";

  useEffect(() => {
    if (isConfigured && status === "unauthenticated") {
      const queryString = typeof window === "undefined" ? "" : window.location.search;
      router.replace(`/login?next=${encodeURIComponent(`${pathname}${queryString}`)}`);
    }
  }, [isConfigured, pathname, router, status]);

  if (isConfigLoading) return <SessionLoading />;
  if (!isConfigured && requiresProductionAuth) return <AuthSetupRequired surface="admin workspace" />;
  if (isConfigured && (status === "loading" || status === "unauthenticated")) return <SessionLoading />;

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const q = search.trim();
    router.push(q ? `/admin/clients?q=${encodeURIComponent(q)}` : "/admin/clients");
  }

  return (
    <main className="min-h-screen bg-[#eef3f2] text-[#12201f]">
      <div className="min-h-screen lg:grid lg:grid-cols-[238px_minmax(0,1fr)]">
        <aside className="border-b border-[#164d45] bg-[#073f38] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0">
          <div className="flex items-center justify-between px-4 py-4 lg:px-5 lg:py-5">
            <Link href="/admin" className="flex min-w-0 items-center gap-3" aria-label="MediVault Admin overview">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/15 bg-white/10 text-[#5eead4]">
                <Icon name="shield" className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-black">MediVault Admin</span>
                <span className="block text-[10px] font-bold text-white/55">Client intelligence center</span>
              </span>
            </Link>
            <div className="lg:hidden"><SignOutButton /></div>
          </div>

          <nav className="flex gap-2 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible lg:px-3 lg:pb-0" aria-label="Admin navigation">
            {adminNav.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-10 min-w-max items-center gap-3 rounded-md px-3 text-[12px] font-extrabold ${active ? "bg-[#27c5b2] text-[#063b35] shadow-[inset_3px_0_0_#a7f3d0]" : "text-white/72 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 hidden px-3 lg:block">
            <p className="px-3 text-[9px] font-black uppercase tracking-[0.12em] text-[#5eead4]">Connected workspaces</p>
            <div className="mt-2 space-y-1">
              {workspaceLinks.map((item) => (
                <Link key={item.href} href={item.href} className="flex h-9 items-center gap-3 rounded-md px-3 text-[11px] font-bold text-white/62 hover:bg-white/10 hover:text-white">
                  <Icon name={item.icon} className="h-4 w-4" />{item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-auto hidden border-t border-white/12 p-4 lg:block">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#5eead4]">Signed in</p>
            <p className="mt-1.5 truncate text-[12px] font-black text-white">{user?.name || "Lab administrator"}</p>
            <p className="mt-0.5 truncate text-[10px] font-semibold text-white/52">{user?.email || "Administrator account"}</p>
            <div className="mt-3"><SignOutButton /></div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-[#d9e5e2] bg-[#f8fbfa]/94 px-3 py-3 backdrop-blur-xl sm:px-5 lg:px-6">
            <div className="mx-auto flex max-w-[1540px] items-center gap-3">
              <form onSubmit={submitSearch} className="relative min-w-0 flex-1">
                <Icon name="family" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f827e]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-10 w-full rounded-md border border-[#d7e4e0] bg-white pl-10 pr-20 text-[12px] font-bold text-[#142421] shadow-sm placeholder:text-[#91a09d] focus:border-[#14b8a6] focus:outline-none focus:ring-4 focus:ring-[#14b8a6]/10"
                  placeholder="Search client name or mobile"
                  aria-label="Search clients"
                />
                <button type="submit" className="absolute right-1.5 top-1.5 h-7 rounded bg-[#e5f7f2] px-3 text-[10px] font-black text-[#087766]">Search</button>
              </form>
              <Link href="/admin/tasks" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[#d7e4e0] bg-white text-[#31504a]" aria-label="Open tasks">
                <Icon name="bell" className="h-4 w-4" />
              </Link>
              <Link href="/lab/create" className="hidden h-10 items-center gap-2 rounded-md bg-[#0b6f61] px-4 text-[11px] font-black text-white sm:inline-flex">
                <Icon name="upload" className="h-4 w-4" />New report
              </Link>
            </div>
          </header>
          <div className="mx-auto max-w-[1540px] px-3 py-4 sm:px-5 lg:px-6 lg:py-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
