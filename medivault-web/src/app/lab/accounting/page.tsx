"use client";

import { useEffect, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";

type Invoice = {
  amount?: number;
  createdAt?: string;
  currency?: string;
  id?: string;
  patientName?: string;
  patientPhone?: string;
  paymentMode?: string;
  paymentReference?: string;
  status?: string;
  testName?: string;
};

type Payload = {
  invoices: Invoice[];
  metrics: { invoiceCount: number; outstandingAmount: number; paidAmount: number; totalAmount: number };
};

function money(value?: number) {
  return `₹${Math.round(value ?? 0).toLocaleString("en-IN")}`;
}

function dateLabel(value?: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

export default function LabAccountingPage() {
  const { session, status } = useAuth();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading" || !session?.access_token) return;
    async function loadAccounting() {
      const response = await fetch("/api/lab/accounting", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error ?? "Accounting could not be loaded.");
        return;
      }
      setData(result);
    }
    loadAccounting();
  }, [session?.access_token, status]);

  return (
    <LabShell>
      <header className="border-b border-[#dbe6e3] pb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#087766]">Billing desk</p>
        <h1 className="mt-1 text-[28px] font-black text-[#17222b]">Accounting</h1>
        <p className="mt-1 text-[12px] font-semibold text-[#65716f]">Track online booking payments, outstanding balances and invoice status.</p>
      </header>

      {error ? <div className="mt-4 rounded-md bg-[#fff0ec] p-3 text-[12px] font-bold text-[#ba563d]">{error}</div> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border border-[#dbe6e3] bg-white p-4"><p className="text-[10px] font-black uppercase text-[#74837f]">Total invoices</p><p className="mt-2 text-[28px] font-black">{data?.metrics.invoiceCount ?? "--"}</p><p className="mt-1 text-[10px] font-bold text-[#087766]">Online + lab billing</p></section>
        <section className="rounded-md border border-[#dbe6e3] bg-white p-4"><p className="text-[10px] font-black uppercase text-[#74837f]">Paid</p><p className="mt-2 text-[28px] font-black">{money(data?.metrics.paidAmount)}</p><p className="mt-1 text-[10px] font-bold text-[#087766]">Confirmed collection</p></section>
        <section className="rounded-md border border-[#dbe6e3] bg-white p-4"><p className="text-[10px] font-black uppercase text-[#74837f]">Outstanding</p><p className="mt-2 text-[28px] font-black">{money(data?.metrics.outstandingAmount)}</p><p className="mt-1 text-[10px] font-bold text-[#ba563d]">Pending payment</p></section>
        <section className="rounded-md border border-[#dbe6e3] bg-[#0d5c46] p-4 text-white"><p className="text-[10px] font-black uppercase text-[#99f6e4]">Total value</p><p className="mt-2 text-[28px] font-black">{money(data?.metrics.totalAmount)}</p><p className="mt-1 text-[10px] font-bold text-white/65">All invoice value</p></section>
      </div>

      <section className="mt-4 overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
        <div className="grid grid-cols-[1fr_120px_110px_110px] gap-3 border-b border-[#e7efed] bg-[#f8fbfa] px-4 py-2 text-[9px] font-black uppercase text-[#74837f]">
          <span>Patient / test</span><span>Amount</span><span>Status</span><span>Date</span>
        </div>
        <div className="divide-y divide-[#edf3f1]">
          {data?.invoices?.length ? data.invoices.map((invoice) => (
            <div key={invoice.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_120px_110px_110px] sm:items-center">
              <div><p className="text-[12px] font-black text-[#17222b]">{invoice.patientName || "Patient"}</p><p className="mt-1 text-[10px] font-semibold text-[#74837f]">{invoice.patientPhone} · {invoice.testName} · {invoice.paymentReference || invoice.paymentMode || "payment"}</p></div>
              <p className="text-[13px] font-black">{money(invoice.amount)}</p>
              <span className={`w-fit rounded px-2 py-1 text-[9px] font-black ${invoice.status === "paid" ? "bg-[#eaf9f2] text-[#087766]" : "bg-[#fff7d8] text-[#8a6500]"}`}>{invoice.status || "issued"}</span>
              <p className="text-[10px] font-bold text-[#74837f]">{dateLabel(invoice.createdAt)}</p>
            </div>
          )) : <div className="p-5 text-[12px] font-bold text-[#74837f]">No invoices yet. Online bookings will appear here automatically.</div>}
        </div>
      </section>
    </LabShell>
  );
}
