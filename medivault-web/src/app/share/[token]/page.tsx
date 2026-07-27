"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { AppReport } from "@/lib/vault-types";

type PublicShare = {
  accessCount: number;
  expiresAt: string;
  recipientLabel?: string;
  reportSnapshot: AppReport;
};

function statusClass(status: string) {
  if (status === "High" || status === "Low") return "bg-[#fff0ec] text-[#ba563d]";
  if (status === "Watch") return "bg-[#fff7d8] text-[#8a6500]";
  return "bg-[#eaf9f2] text-[#087766]";
}

export default function SecureSharePage() {
  const params = useParams<{ token: string }>();
  const [share, setShare] = useState<PublicShare | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.token) return;
    fetch(`/api/public/share/${encodeURIComponent(params.token)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || "Shared report could not be opened.");
        setShare(result.share);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Shared report could not be opened."));
  }, [params.token]);

  if (error) {
    return <main className="grid min-h-screen place-items-center bg-[#edf4f2] p-5"><section className="w-full max-w-[520px] rounded-lg border border-[#f2c6bb] bg-white p-6"><p className="text-[12px] font-black uppercase text-[#ba563d]">Secure share unavailable</p><h1 className="mt-2 text-[24px] font-black text-[#162523]">{error}</h1><p className="mt-3 text-[13px] leading-6 text-[#65716f]">Ask the patient for a new link. Expired and revoked links cannot be reopened.</p></section></main>;
  }

  if (!share) {
    return <main className="grid min-h-screen place-items-center bg-[#edf4f2]"><p className="text-[14px] font-black text-[#087766]">Opening protected report...</p></main>;
  }

  const report = share.reportSnapshot;
  return (
    <main className="min-h-screen bg-[#edf4f2] px-4 py-6 text-[#162523]">
      <div className="mx-auto max-w-[760px]">
        <header className="rounded-lg bg-[#102f35] p-5 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#72e6ca]">MediVault secure clinical share</p>
          <h1 className="mt-2 text-[26px] font-black">{report.title}</h1>
          <p className="mt-2 text-[12px] font-semibold text-white/70">{report.memberName} · {report.lab} · {report.date}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black">
            <span className="rounded bg-white/10 px-2 py-1">{report.source === "lab" ? "Published lab record" : "Patient uploaded"}</span>
            <span className="rounded bg-white/10 px-2 py-1">Expires {new Date(share.expiresAt).toLocaleString()}</span>
          </div>
        </header>

        <section className="mt-4 rounded-lg border border-[#dbe6e3] bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div><p className="text-[9px] font-black uppercase text-[#74837f]">Category</p><p className="mt-1 text-[13px] font-black">{report.category}</p></div>
            <div><p className="text-[9px] font-black uppercase text-[#74837f]">Parameters</p><p className="mt-1 text-[13px] font-black">{report.parameters}</p></div>
            <div><p className="text-[9px] font-black uppercase text-[#74837f]">Flagged</p><p className="mt-1 text-[13px] font-black">{report.abnormal}</p></div>
          </div>
          <div className="mt-4 border-t border-[#edf3f1] pt-4">
            <p className="text-[10px] font-black uppercase text-[#087766]">Report summary</p>
            <p className="mt-2 text-[13px] leading-6 text-[#52605d]">{report.summary}</p>
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-lg border border-[#dbe6e3] bg-white">
          <div className="grid grid-cols-[1fr_110px] border-b border-[#e7efed] bg-[#f8fbfa] px-4 py-3 text-[9px] font-black uppercase text-[#74837f]"><span>Observation / reference</span><span className="text-right">Result</span></div>
          <div className="divide-y divide-[#edf3f1]">
            {report.markers.map((marker, index) => (
              <div key={`${marker.name}-${index}`} className="grid grid-cols-[1fr_110px] gap-3 px-4 py-3">
                <div><p className="text-[12px] font-black">{marker.name}</p><p className="mt-1 text-[10px] font-semibold text-[#74837f]">{marker.range}</p></div>
                <div className="text-right"><p className="text-[12px] font-black">{marker.value}</p><span className={`mt-1 inline-flex rounded px-2 py-1 text-[8px] font-black ${statusClass(marker.status)}`}>{marker.status}</span></div>
              </div>
            ))}
          </div>
        </section>

        <footer className="py-5 text-center text-[10px] font-semibold leading-5 text-[#71817d]">
          This time-limited view was authorized by the patient. Verify clinical decisions against the issuing report and healthcare professional.
        </footer>
      </div>
    </main>
  );
}
