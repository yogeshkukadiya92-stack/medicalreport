"use client";

import Link from "next/link";
import { LabShell } from "@/components/lab-shell";
import { Icon } from "@/components/mobile-shell";

const kpis = [
  { label: "Live labs", value: "18", note: "+3 this month", tone: "green" },
  { label: "Orders today", value: "1,284", note: "92% on time", tone: "dark" },
  { label: "Critical pending", value: "12", note: "4 unacknowledged", tone: "red" },
  { label: "Revenue", value: "₹8.4L", note: "GST ready", tone: "amber" },
];

const branches = [
  { name: "Ahmedabad Central", tat: "91%", orders: 428, qc: "Pass", status: "Online" },
  { name: "Surat Ring Road", tat: "86%", orders: 302, qc: "Watch", status: "Online" },
  { name: "Rajkot Hub", tat: "78%", orders: 196, qc: "Review", status: "Queue high" },
  { name: "Vadodara East", tat: "94%", orders: 358, qc: "Pass", status: "Online" },
];

const roleRows = [
  ["Admin", "Settings, billing, branches, audit"],
  ["Pathologist", "Verify, sign, correct reports"],
  ["Technician", "Analyzer review, result entry, QC"],
  ["Collector", "Barcode, collection, receive/reject"],
  ["Cashier", "GST invoice, payment, refunds"],
];

function toneClass(tone: string) {
  if (tone === "red") return "bg-[#fff0ec] text-[#ba563d]";
  if (tone === "amber") return "bg-[#fff8dc] text-[#8a6500]";
  if (tone === "green") return "bg-[#eaf9f2] text-[#087766]";
  return "bg-[#102323] text-white";
}

export default function AdminPage() {
  return (
    <LabShell>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#087766]">Platform command center</p>
          <h1 className="mt-2 text-[30px] font-black tracking-normal text-[#101c1c]">Admin operations</h1>
          <p className="mt-2 max-w-2xl text-[14px] font-semibold leading-6 text-[#65716f]">
            Multi-lab monitoring for branches, roles, billing, QC evidence, integrations, backups and audit trail.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/lab" className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#dce9e5] bg-white px-4 text-[13px] font-bold text-[#102323]">
            <Icon name="analytics" className="h-4 w-4" />
            Lab view
          </Link>
          <Link href="/dashboard" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0a7d6e] px-4 text-[13px] font-bold text-white">
            <Icon name="home" className="h-4 w-4" />
            Patient app
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <section key={item.label} className="rounded-lg border border-[#e2ebe8] bg-white p-4 shadow-[0_10px_28px_rgba(20,67,60,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[12px] font-bold text-[#6f7f7c]">{item.label}</p>
              <span className={`rounded-md px-2 py-1 text-[10px] font-black ${toneClass(item.tone)}`}>{item.note}</span>
            </div>
            <p className="mt-4 text-[34px] font-black text-[#102323]">{item.value}</p>
          </section>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-lg border border-[#e2ebe8] bg-white">
          <div className="flex items-center justify-between border-b border-[#edf3f1] p-4">
            <div>
              <h2 className="text-[16px] font-black text-[#102323]">Branch performance</h2>
              <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">Orders, TAT, QC and live status</p>
            </div>
            <span className="rounded-md bg-[#eaf9f2] px-2 py-1 text-[11px] font-black text-[#087766]">FHIR ready</span>
          </div>
          <div className="divide-y divide-[#edf3f1]">
            {branches.map((branch) => (
              <div key={branch.name} className="grid gap-3 p-4 md:grid-cols-[1fr_120px_120px_120px] md:items-center">
                <div>
                  <p className="text-[14px] font-black text-[#162523]">{branch.name}</p>
                  <p className="mt-1 text-[12px] font-bold text-[#7b8986]">{branch.orders} orders today</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#8a9794]">TAT</p>
                  <p className="mt-1 text-[17px] font-black text-[#102323]">{branch.tat}</p>
                </div>
                <span className={`w-fit rounded-md px-2 py-1 text-[11px] font-black ${branch.qc === "Pass" ? "bg-[#eaf9f2] text-[#087766]" : branch.qc === "Watch" ? "bg-[#fff8dc] text-[#8a6500]" : "bg-[#fff0ec] text-[#ba563d]"}`}>
                  QC {branch.qc}
                </span>
                <span className="text-[12px] font-bold text-[#52605d]">{branch.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#e2ebe8] bg-white">
          <div className="border-b border-[#edf3f1] p-4">
            <h2 className="text-[16px] font-black text-[#102323]">Granular roles</h2>
            <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">Permission model for scale</p>
          </div>
          <div className="divide-y divide-[#edf3f1]">
            {roleRows.map(([role, scope]) => (
              <div key={role} className="p-4">
                <p className="text-[13px] font-black text-[#162523]">{role}</p>
                <p className="mt-1 text-[12px] leading-5 text-[#65716f]">{scope}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        {[
          ["Data layer", "FHIR R4 DiagnosticReport, Observation and Specimen normalization with encrypted object storage."],
          ["Queues", "OCR, analyzer imports, WhatsApp delivery, backups and report publish jobs run in background queues."],
          ["Audit", "Every correction, digital signature, access request and critical acknowledgement stays traceable."],
        ].map(([title, body]) => (
          <section key={title} className="rounded-lg border border-[#e2ebe8] bg-white p-4">
            <h3 className="text-[15px] font-black text-[#102323]">{title}</h3>
            <p className="mt-2 text-[13px] leading-6 text-[#65716f]">{body}</p>
          </section>
        ))}
      </div>
    </LabShell>
  );
}
