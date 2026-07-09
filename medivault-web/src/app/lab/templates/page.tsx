"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";
import type { LabTemplate } from "@/lib/vault-types";

export default function LabTemplatesPage() {
  const { isConfigured, session, status } = useAuth();
  const [templates, setTemplates] = useState<LabTemplate[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isConfigured || status === "loading") return;
    if (!session?.access_token) return;
    async function loadTemplates() {
      try {
        const response = await fetch("/api/lab/templates", {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        const result = await response.json().catch(() => null);
        if (response.ok) {
          setTemplates(result?.templates ?? []);
        } else {
          setError(result?.error ?? "Templates could not be loaded.");
        }
      } catch {
        setError("Templates could not be loaded. Refresh after sign-in, or allow this site in any browser content blocker.");
      }
    }
    loadTemplates();
  }, [isConfigured, session?.access_token, status]);

  return (
    <LabShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-bold text-[#087766]">Standard panels</p>
          <h1 className="mt-1 text-[28px] font-black text-[#101c1c]">Report templates</h1>
        </div>
        <Link href="/lab/create" className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0a7d6e] px-4 text-[13px] font-bold text-white">
          Create from template
        </Link>
      </div>

      {error ? <div className="mt-5 rounded-lg bg-[#fff0ec] p-3 text-[13px] font-bold text-[#ba563d]">{error}</div> : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {templates.map((template) => (
          <section key={template.id} className="rounded-lg border border-[#e2ebe8] bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-[#edf3f1] p-4">
              <div>
                <h2 className="text-[16px] font-black text-[#102323]">{template.name}</h2>
                <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">{template.category}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-md bg-[#f1f6f4] px-2.5 py-1 text-[11px] font-bold text-[#52605d]">
                  {template.tests.length} values
                </span>
                <Link href={`/lab/create?template=${encodeURIComponent(template.id)}`} className="rounded-md bg-[#0a7d6e] px-3 py-2 text-[12px] font-bold text-white">
                  Use
                </Link>
              </div>
            </div>
            <div className="divide-y divide-[#edf3f1]">
              {template.tests.length ? (
                template.tests.map((test) => (
                  <div key={`${template.id}-${test.name}`} className="grid gap-2 p-3 text-[13px] md:grid-cols-[1.2fr_0.7fr_1fr]">
                    <span className="font-black text-[#162523]">{test.name}</span>
                    <span className="font-bold text-[#52605d]">{test.unit || "--"}</span>
                    <span className="font-bold text-[#6f7f7c]">{test.referenceRange || "No range"}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-[13px] font-bold text-[#6f7f7c]">Custom panel starts empty.</div>
              )}
            </div>
          </section>
        ))}
      </div>
    </LabShell>
  );
}
