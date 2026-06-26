"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/app-data-provider";
import { Icon, MobileShell } from "@/components/mobile-shell";

type PreparedFile = {
  dataUrls: string[];
  mimeType: string;
};

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
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState("");
  const hasMembers = familyMembers.length > 0;

  useEffect(() => {
    if (activeMember) {
      setMemberId(activeMember.id);
    } else if (familyMembers[0]) {
      setMemberId(familyMembers[0].id);
    }
  }, [activeMember, familyMembers]);

  useEffect(() => {
    if (!isSaving) return;

    const timer = window.setInterval(() => {
      setAnalysisProgress((current) => (current < 92 ? Math.min(current + 3, 92) : current));
    }, 850);

    return () => window.clearInterval(timer);
  }, [isSaving]);

  async function prepareFileForAi(file: File): Promise<PreparedFile> {
    if (file.type.startsWith("image/")) {
      return { dataUrls: [await compressImageForAi(file)], mimeType: "image/jpeg" };
    }

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      return { dataUrls: await renderPdfForAi(file), mimeType: "image/jpeg" };
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    return { dataUrls: [dataUrl], mimeType: file.type };
  }

  async function compressImageForAi(file: File) {
    const sourceUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not read this image. Try another screenshot or photo."));
        img.src = sourceUrl;
      });

      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image processing is not available on this device.");
      context.drawImage(image, 0, 0, width, height);
      return canvas.toDataURL("image/jpeg", 0.82);
    } finally {
      URL.revokeObjectURL(sourceUrl);
    }
  }

  async function renderPdfForAi(file: File) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pageCount = Math.min(pdf.numPages, 2);
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(2, 1500 / Math.max(baseViewport.width, baseViewport.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("PDF rendering is not available on this device.");
      await page.render({ canvasContext: context, viewport }).promise;
      pages.push(canvas.toDataURL("image/jpeg", 0.82));
    }

    if (!pages.length) throw new Error("Could not read this PDF. Try uploading a clearer report image.");
    return pages;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(false);
    setAnalysisProgress(0);
    setAnalysisStep("");

    const file = inputRef.current?.files?.[0] ?? null;
    if (!file) {
      setError("Select a PDF or image first.");
      return;
    }

    setIsSaving(true);
    setAnalysisProgress(8);
    setAnalysisStep("Saving report");
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
      setAnalysisProgress(18);
      setAnalysisStep(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? "Preparing PDF pages" : "Preparing image");
      const preparedFile = await prepareFileForAi(file);
      setAnalysisProgress(38);
      setAnalysisStep("Uploading securely");
      const response = await fetch("/api/analyze-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileDataUrl: preparedFile.dataUrls[0],
          fileDataUrls: preparedFile.dataUrls,
          fileName: file.name,
          lab,
          memberName: report.memberName,
          mimeType: preparedFile.mimeType,
          originalMimeType: file.type,
          title: report.title,
        }),
      });
      setAnalysisProgress(76);
      setAnalysisStep("Reading values");
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "AI analysis failed. Please try a clearer report image.");
      setAnalysisProgress(94);
      setAnalysisStep("Building summary");
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
      setAnalysisProgress(100);
      setAnalysisStep("Complete");
      setMessage(`${report.title} analyzed and added to reports.`);
    } catch (analysisError) {
      setAnalysisProgress(100);
      setAnalysisStep("Needs attention");
      updateReport(report.id, {
        category: "General",
        status: "Watch",
        summary:
          analysisError instanceof Error && analysisError.message !== "Load failed"
            ? analysisError.message
            : "AI analysis could not connect. Check Railway OPENAI_API_KEY and try again with a clear JPG/PNG report image.",
      });
    } finally {
      window.setTimeout(() => {
        setIsSaving(false);
        router.push("/reports");
      }, 650);
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
                <span>{analysisProgress}%</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[15px] font-black text-[#162523]">{analysisStep || "Working"}</p>
                <p className="text-right text-[11px] font-bold text-[#7b8986]">
                  Usually 10-30 sec
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf3f1]">
                <div className="h-full rounded-full bg-[#0a7d6e] transition-all duration-500" style={{ width: `${analysisProgress}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-[#7b8986]">
                <span className={analysisProgress >= 8 ? "text-[#087766]" : ""}>Saved</span>
                <span className={analysisProgress >= 18 ? "text-[#087766]" : ""}>Prepared</span>
                <span className={analysisProgress >= 38 ? "text-[#087766]" : ""}>Uploaded</span>
                <span className={analysisProgress >= 94 ? "text-[#087766]" : ""}>Summary</span>
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
