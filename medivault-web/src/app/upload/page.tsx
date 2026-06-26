"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/app-data-provider";
import { Icon, MobileShell } from "@/components/mobile-shell";

export default function Upload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { activeMember, addReport, familyMembers, updateReport } = useAppData();
  const [fileName, setFileName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [title, setTitle] = useState("");
  const [lab, setLab] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const hasMembers = familyMembers.length > 0;

  useEffect(() => {
    if (activeMember) {
      setMemberId(activeMember.id);
    } else if (familyMembers[0]) {
      setMemberId(familyMembers[0].id);
    }
  }, [activeMember, familyMembers]);

  async function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(false);

    const file = inputRef.current?.files?.[0] ?? null;
    if (!file) {
      setError("Select a PDF or image first.");
      return;
    }

    setIsSaving(true);
    const report = addReport({
      fileName,
      lab,
      memberId,
      title: title || fileName.replace(/\.[^.]+$/, ""),
    });
    setMessage(`${report.title} saved. AI analysis is extracting values and building the summary.`);
    setTitle("");
    setLab("");
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";

    try {
      const fileDataUrl = await readFileAsDataUrl(file);
      const response = await fetch("/api/analyze-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileDataUrl,
          fileName: file.name,
          lab,
          memberName: report.memberName,
          mimeType: file.type,
          title: report.title,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error ?? "AI analysis failed");
      updateReport(report.id, {
        abnormal: result.abnormal,
        aiConfidence: result.aiConfidence,
        category: result.category,
        markers: result.markers,
        parameters: result.parameters,
        status: result.status,
        summary: result.summary,
        title: result.title || report.title,
      });
      setMessage(`${report.title} analyzed and added to reports.`);
    } catch (analysisError) {
      updateReport(report.id, {
        category: "General",
        status: "Watch",
        summary: analysisError instanceof Error ? analysisError.message : "AI analysis could not finish. Keep this report for manual review.",
      });
    } finally {
      setIsSaving(false);
      window.setTimeout(() => router.push("/reports"), 500);
    }
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

        {!hasMembers ? (
          <div className="mt-6 rounded-lg border border-dashed border-[#c5d8d3] bg-white p-5 text-center">
            <p className="text-[16px] font-black text-[#162523]">Add a family member first</p>
            <p className="mt-2 text-[13px] text-[#65716f]">Reports need a member so they can be grouped correctly.</p>
            <Link href="/family" className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#0a7d6e] px-4 text-[13px] font-bold text-white">
              Go to family
            </Link>
          </div>
        ) : (
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
              PDF, JPG, or PNG. The app will save it, extract key markers, and prepare a doctor-ready summary.
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
          {isSaving ? (
            <div className="rounded-lg border border-[#dce9e5] bg-white p-4">
              <div className="flex items-center justify-between text-[12px] font-bold text-[#52605d]">
                <span>AI analysis</span>
                <span>Working</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf3f1]">
                <div className="h-full w-3/4 rounded-full bg-[#0a7d6e]" />
              </div>
            </div>
          ) : null}

          <button disabled={isSaving} type="submit" className="h-12 w-full rounded-lg bg-[#0a7d6e] text-[14px] font-bold text-white shadow-[0_12px_30px_rgba(10,125,110,0.2)] disabled:opacity-70">
            {isSaving ? "Analyzing report" : "Save report"}
          </button>
          <button type="button" onClick={() => router.push("/reports")} className="h-12 w-full rounded-lg border border-[#dce9e5] bg-white text-[14px] font-bold text-[#102323]">
            View reports
          </button>
        </form>
        )}
      </section>
    </MobileShell>
  );
}
