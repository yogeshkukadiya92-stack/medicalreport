"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { AuthSetupRequired, SessionLoading } from "@/components/auth-gate";
import { useAuth } from "@/components/auth-provider";

type IconName = "home" | "reports" | "analytics" | "family" | "upload" | "bell" | "shield" | "trend" | "calendar";

const navItems: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/reports", label: "Reports", icon: "reports" },
  { href: "/upload", label: "Upload", icon: "upload" },
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
  const requiresProductionAuth = process.env.NODE_ENV === "production";

  useEffect(() => {
    if (isConfigured && status === "unauthenticated") {
      router.replace("/login");
    }
  }, [isConfigured, router, status]);

  if (!isConfigured && requiresProductionAuth) {
    return <AuthSetupRequired surface="client app" />;
  }

  if (isConfigured && (status === "loading" || status === "unauthenticated")) {
    return <SessionLoading />;
  }

  return (
    <main className="min-h-dvh bg-[#eaf1ef] text-[#101c1c] md:flex md:items-center md:justify-center md:p-8">
      <div className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-x-hidden bg-[#fbfdfc] shadow-[0_24px_80px_rgba(10,31,31,0.18)] md:min-h-[860px] md:overflow-hidden md:rounded-[28px] md:border md:border-white/70">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_18%_0%,rgba(44,185,156,0.20),transparent_36%),radial-gradient(circle_at_88%_4%,rgba(65,103,168,0.12),transparent_30%),linear-gradient(180deg,#f8fffc_0%,rgba(248,255,252,0)_100%)]" />
        <div className="pointer-events-none sticky top-0 z-30 flex justify-center pt-[max(env(safe-area-inset-top),10px)] md:hidden">
          <div className="mt-1 h-1.5 w-12 rounded-full bg-[#c9d8d4]" />
        </div>
        <div className="relative pb-[calc(104px+env(safe-area-inset-bottom))]">{children}</div>
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] border-t border-[#dbe7e3] bg-white/92 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_42px_rgba(16,35,35,0.10)] backdrop-blur-xl md:absolute">
          <div className="grid grid-cols-5 items-end gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const isUpload = item.icon === "upload";
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-bold ${
                    isUpload
                      ? `h-16 -translate-y-2 text-white ${isActive ? "text-white" : "text-white"}`
                      : `h-14 ${isActive ? "bg-[#e8f7f2] text-[#087766]" : "text-[#81908d] hover:bg-[#f4f8f7] hover:text-[#31413f]"}`
                  }`}
                >
                  {isUpload ? (
                    <span className={`grid h-12 w-12 place-items-center rounded-full shadow-[0_14px_32px_rgba(10,125,110,0.28)] ${isActive ? "bg-[#0b2b2b]" : "bg-[#0a7d6e]"}`}>
                      <Icon name={item.icon} className="h-5 w-5" />
                    </span>
                  ) : (
                    <Icon name={item.icon} className="h-5 w-5" />
                  )}
                  <span className={isUpload ? "text-[#087766]" : ""}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}
