"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";

type IconName = "home" | "reports" | "analytics" | "family" | "upload" | "bell" | "shield" | "trend" | "calendar";

const navItems: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/reports", label: "Reports", icon: "reports" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/family", label: "Family", icon: "family" },
];

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const shared = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...shared}>
          <path d="M4.5 10.8 12 4.5l7.5 6.3" />
          <path d="M6.5 10.2v8.4a1.4 1.4 0 0 0 1.4 1.4h8.2a1.4 1.4 0 0 0 1.4-1.4v-8.4" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "reports":
      return (
        <svg {...shared}>
          <path d="M7.5 3.8h6.4l3.6 3.7v12.7H7.5a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2Z" />
          <path d="M13.7 3.8v3.9h3.8" />
          <path d="M8.8 12h6.4" />
          <path d="M8.8 15.5h4.7" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...shared}>
          <path d="M4.8 19.2h14.4" />
          <path d="M7 16.8v-5.4" />
          <path d="M12 16.8V6.2" />
          <path d="M17 16.8v-8" />
        </svg>
      );
    case "family":
      return (
        <svg {...shared}>
          <path d="M9.2 11.2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M15.6 10.4a2.4 2.4 0 1 0 0-4.8" />
          <path d="M4.7 19.3a4.7 4.7 0 0 1 9.1 0" />
          <path d="M14.8 15.1a4 4 0 0 1 4.5 4.2" />
        </svg>
      );
    case "upload":
      return (
        <svg {...shared}>
          <path d="M12 15.5V4.8" />
          <path d="m7.9 8.6 4.1-4 4.1 4" />
          <path d="M5.5 15.7v2.5a1.8 1.8 0 0 0 1.8 1.8h9.4a1.8 1.8 0 0 0 1.8-1.8v-2.5" />
        </svg>
      );
    case "bell":
      return (
        <svg {...shared}>
          <path d="M18 9.7a6 6 0 0 0-12 0c0 6-2.2 6.8-2.2 6.8h16.4S18 15.7 18 9.7Z" />
          <path d="M9.8 19.1a2.3 2.3 0 0 0 4.4 0" />
        </svg>
      );
    case "shield":
      return (
        <svg {...shared}>
          <path d="M12 3.8 18.5 6v5.6c0 4.2-2.7 7.1-6.5 8.6-3.8-1.5-6.5-4.4-6.5-8.6V6L12 3.8Z" />
          <path d="m9.4 12 1.8 1.8 3.7-4" />
        </svg>
      );
    case "trend":
      return (
        <svg {...shared}>
          <path d="M4.8 16.8 9 12.6l3.1 3.1 6.8-7" />
          <path d="M14.8 8.6h4.1v4.1" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...shared}>
          <path d="M7.2 4.4v3" />
          <path d="M16.8 4.4v3" />
          <path d="M5.8 6h12.4a1.8 1.8 0 0 1 1.8 1.8v10.4a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 18.2V7.8A1.8 1.8 0 0 1 5.8 6Z" />
          <path d="M4 10h16" />
        </svg>
      );
  }
}

export { Icon };

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isConfigured, status } = useAuth();

  useEffect(() => {
    if (isConfigured && status === "unauthenticated") {
      router.replace("/login");
    }
  }, [isConfigured, router, status]);

  if (isConfigured && (status === "loading" || status === "unauthenticated")) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef3f1] px-5 text-[#101c1c]">
        <div className="w-full max-w-[430px] rounded-lg bg-white p-5 text-center shadow-[0_24px_70px_rgba(10,31,31,0.12)]">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#dce9e5] border-t-[#0a7d6e]" />
          <p className="mt-4 text-[13px] font-bold text-[#65716f]">Checking secure session</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef3f1] text-[#101c1c] md:flex md:items-center md:justify-center md:p-8">
      <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-[#fbfdfc] shadow-[0_24px_80px_rgba(10,31,31,0.18)] md:min-h-[860px] md:overflow-hidden md:rounded-[28px] md:border md:border-white/70">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_20%_0%,rgba(44,185,156,0.18),transparent_34%),linear-gradient(180deg,#f7fffc_0%,rgba(247,255,252,0)_100%)]" />
        <div className="relative pb-28">{children}</div>
        <nav className="sticky bottom-0 z-20 border-t border-[#dbe7e3] bg-white/94 px-4 pb-5 pt-3 shadow-[0_-18px_42px_rgba(16,35,35,0.08)] backdrop-blur-xl">
          <div className="grid grid-cols-4 gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold ${
                    isActive ? "bg-[#e8f7f2] text-[#087766]" : "text-[#81908d] hover:bg-[#f4f8f7] hover:text-[#31413f]"
                  }`}
                >
                  <Icon name={item.icon} className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}
