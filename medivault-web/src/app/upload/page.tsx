"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/app-data-provider";
import { Icon, MobileShell } from "@/components/mobile-shell";

export default function Upload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { activeMember, addReport, familyMembers } = useAppData();
  const [fileName, setFileName] = useState("");
  const [memberId, setMemberId] = useState(activeMember.id);
  const [title, setTitle] = useState("");
  const [lab, setLab] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMemberId(activeMember.id);
  }, [activeMember.id]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!fileName) {
      setError("Select a PDF or image first.");
      return;
    }

    const report = addReport({
      fileName,
      lab,
      memberId,
      title: title || fileName.replace(/\.[^.]+$/, ""),
    });
    setMessage(`${report.title} saved. Processing will finish automatically.`);
    setTitle("");
    setLab("");
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
    window.setTimeout(() => router.push("/reports"), 700);
  }

  return (
    <MobileShell>
      <section className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[#6f7f7c]">New document</p>
            <h1 className="mt-1 text-[24px] font-bold leading-tight text-[#101c1c]">Upload report</h1>
          </div>
          <Link href="/dashboard" className="grid h-11 w-11 place-items-center rounded-lg border border-[#dce9e5] bg-white text-[#223230]" aria-label="Dashboard">
            <Icon name="home" className="h-5 w-5" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-lg border border-dashed border-[#91cfc2] bg-[#f7fbfa] p-5 text-center"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-[#e8f7f2] text-[#087766]">
              <Icon name="upload" className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-[18px] font-bold text-[#162523]">{fileName || "Select a report file"}</h2>
            <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-5 text-[#65716f]">
              PDF, JPG, or PNG. Saved reports persist in this browser and processing completes automatically.
            </p>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
          />

          <label className="block">
            <span className="text-[12px] font-bold text-[#52605d]">Family member</span>
            <select value={memberId} onChange={(event) => setMemberId(event.target.value)} className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] bg-white px-4 text-[14px] font-bold text-[#162523]">
              {familyMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.relation}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[12px] font-bold text-[#52605d]">Report title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Complete Blood Count" className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] bg-white px-4 text-[14px] font-bold text-[#162523]" />
          </label>

          <label className="block">
            <span className="text-[12px] font-bold text-[#52605d]">Lab or doctor</span>
            <input value={lab} onChange={(event) => setLab(event.target.value)} placeholder="Apollo Diagnostics" className="mt-2 h-12 w-full rounded-lg border border-[#dce9e5] bg-white px-4 text-[14px] font-bold text-[#162523]" />
          </label>

          {error ? <p className="rounded-lg bg-[#fff0ec] p-3 text-[13px] font-bold text-[#ba563d]">{error}</p> : null}
          {message ? <p className="rounded-lg bg-[#eaf9f2] p-3 text-[13px] font-bold text-[#087766]">{message}</p> : null}

          <button type="submit" className="h-12 w-full rounded-lg bg-[#0a7d6e] text-[14px] font-bold text-white shadow-[0_12px_30px_rgba(10,125,110,0.2)]">
            Save report
          </button>
          <button type="button" onClick={() => router.push("/reports")} className="h-12 w-full rounded-lg border border-[#dce9e5] bg-white text-[14px] font-bold text-[#102323]">
            View reports
          </button>
        </form>
      </section>
    </MobileShell>
  );
}
