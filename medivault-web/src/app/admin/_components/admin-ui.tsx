import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/mobile-shell";

export function AdminPageHeader({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#dce7e4] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0a8170]">{eyebrow}</p>
        <h1 className="mt-1 text-[26px] font-black text-[#10201e] sm:text-[30px]">{title}</h1>
        <p className="mt-1 max-w-3xl text-[12px] font-semibold leading-5 text-[#687975]">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

const toneClasses = {
  critical: "border-[#f2cabe] bg-[#fff7f4] text-[#a8452f]",
  dark: "border-[#183c37] bg-[#12352f] text-white",
  green: "border-[#cde9e1] bg-[#f1fbf8] text-[#087766]",
  neutral: "border-[#dbe6e3] bg-white text-[#142421]",
  warning: "border-[#ebddad] bg-[#fffaf0] text-[#7d5b00]",
};

export function AdminStatCard({
  href,
  label,
  note,
  tone = "neutral",
  value,
}: {
  href?: string;
  label: string;
  note: string;
  tone?: keyof typeof toneClasses;
  value: ReactNode;
}) {
  const body = (
    <div className={`h-full rounded-md border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[10px] font-black uppercase ${tone === "dark" ? "text-white/58" : "text-[#72817e]"}`}>{label}</p>
        {href ? <Icon name="trend" className="h-3.5 w-3.5 opacity-70" /> : null}
      </div>
      <p className="mt-3 text-[28px] font-black leading-none">{value}</p>
      <p className={`mt-2 text-[10px] font-bold ${tone === "dark" ? "text-white/62" : "opacity-75"}`}>{note}</p>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "critical" | "green" | "neutral" | "warning" | "blue" }) {
  const classes = {
    blue: "bg-[#edf4ff] text-[#315da8]",
    critical: "bg-[#fff0ec] text-[#b45139]",
    green: "bg-[#e8f8f2] text-[#087766]",
    neutral: "bg-[#edf2f1] text-[#60706c]",
    warning: "bg-[#fff5d5] text-[#806000]",
  };
  return <span className={`inline-flex min-h-6 items-center rounded px-2 py-1 text-[9px] font-black ${classes[tone]}`}>{children}</span>;
}

export function AdminError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-md border border-[#f2cabe] bg-[#fff7f4] p-4 text-[12px] font-bold text-[#a8452f] sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      {onRetry ? <button type="button" onClick={onRetry} className="h-8 rounded border border-current px-3 text-[10px] font-black">Retry</button> : null}
    </div>
  );
}

export function AdminEmpty({ action, description, title }: { action?: ReactNode; description: string; title: string }) {
  return (
    <div className="grid min-h-48 place-items-center p-6 text-center">
      <div>
        <span className="mx-auto grid h-10 w-10 place-items-center rounded-md bg-[#e9f6f2] text-[#087766]"><Icon name="reports" className="h-5 w-5" /></span>
        <p className="mt-3 text-[13px] font-black text-[#18302c]">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-[11px] font-semibold leading-5 text-[#71817d]">{description}</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}

export function AdminSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[#edf2f1]" aria-label="Loading data">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid gap-3 p-4 md:grid-cols-4">
          <span className="h-4 animate-pulse rounded bg-[#e8efed]" />
          <span className="h-4 animate-pulse rounded bg-[#edf3f1]" />
          <span className="h-4 animate-pulse rounded bg-[#edf3f1]" />
          <span className="h-4 animate-pulse rounded bg-[#edf3f1]" />
        </div>
      ))}
    </div>
  );
}
