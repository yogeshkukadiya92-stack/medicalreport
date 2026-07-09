"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppData } from "@/components/app-data-provider";
import { Icon, MobileShell } from "@/components/mobile-shell";
import { SignOutButton } from "@/components/sign-out-button";

export default function Dashboard() {
  const { activeMember, familyMembers, reportsForActiveMember, setActiveMemberId } = useAppData();
  const [notice, setNotice] = useState("");
  const attentionCount = reportsForActiveMember.filter((report) => report.abnormal > 0 || report.status === "Needs review").length;
  const recentReports = reportsForActiveMember.slice(0, 3);
  const hasMembers = familyMembers.length > 0;
  const activeMemberId = activeMember?.id ?? null;

  const attentionItems = useMemo(() => {
    if (!attentionCount) return [];
    return reportsForActiveMember
      .filter((report) => report.abnormal > 0 || report.status === "Needs review")
      .slice(0, 2)
      .map((report, index) => ({
        id: report.id,
        label: report.title,
        value: `${report.abnormal} flagged`,
        tone: index === 0 ? "coral" : "mint",
        note: report.summary || (report.status === "Needs review" ? "Needs review" : "Watch trend"),
      }));
  }, [attentionCount, reportsForActiveMember]);

  return (
    <MobileShell>
      <section className="px-5 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[#6f7f7c]">MediVault</p>
            <h1 className="mt-1 text-[24px] font-bold leading-tight tracking-normal text-[#101c1c]">
              {hasMembers ? `Good morning, ${activeMember?.name}` : "Add your first family member"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              onClick={() => setNotice(attentionCount ? `${attentionCount} report needs review.` : "All reports are up to date.")}
              className="grid h-11 w-11 place-items-center rounded-lg border border-[#dce9e5] bg-white text-[#223230] shadow-[0_8px_24px_rgba(20,67,60,0.08)]"
            >
              <Icon name="bell" className="h-5 w-5" />
            </button>
            <SignOutButton />
          </div>
        </div>

        {notice ? (
          <div className="mt-4 rounded-lg border border-[#dce9e5] bg-white p-3 text-[13px] font-bold text-[#087766]">
            {notice}
          </div>
        ) : null}

        {hasMembers ? (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {familyMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setActiveMemberId(member.id)}
                className={`min-w-[104px] rounded-lg border px-3 py-3 text-left ${
                  member.id === activeMemberId
                    ? "border-[#0a7d6e] bg-[#0b2b2b] text-white shadow-[0_16px_32px_rgba(11,43,43,0.18)]"
                    : "border-[#dce9e5] bg-white text-[#44524f]"
                }`}
              >
                <span className="block text-[13px] font-bold">{member.name}</span>
                <span className={`mt-1 block text-[11px] ${member.id === activeMemberId ? "text-[#aee7d9]" : "text-[#81908d]"}`}>
                  {member.relation} - {member.score}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-[#c5d8d3] bg-white p-5">
            <p className="text-[16px] font-black text-[#162523]">Your vault is empty</p>
            <p className="mt-2 text-[13px] text-[#65716f]">Add a family member first, then upload reports and track analytics.</p>
            <Link href="/family" className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#0a7d6e] px-4 text-[13px] font-bold text-white">
              Add family member
            </Link>
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-lg bg-[#102323] p-5 text-white shadow-[0_22px_52px_rgba(16,35,35,0.28)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-[#a9bfba]">Health score</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-[56px] font-black leading-none tracking-normal">{hasMembers ? activeMember?.score : "--"}</span>
                <span className="mb-2 text-[13px] font-semibold text-[#99f0db]">
                  {hasMembers ? (activeMember && activeMember.score >= 90 ? "Great" : activeMember && activeMember.score >= 80 ? "Good" : "Watch") : "Waiting"}
                </span>
              </div>
              <p className="mt-3 max-w-[180px] text-[13px] leading-5 text-[#c5d4d1]">
                {hasMembers ? `${attentionCount} need attention from ${reportsForActiveMember.length} reports.` : "Add members and reports to unlock health insights."}
              </p>
            </div>

            <div
              className="relative grid h-[116px] w-[116px] shrink-0 place-items-center rounded-full"
              style={{
                background: hasMembers
                  ? `conic-gradient(#38d7b1 0 ${activeMember?.score ?? 0}%, rgba(255,255,255,0.12) ${activeMember?.score ?? 0}% 100%)`
                  : "conic-gradient(#2b3a3a 0 100%, rgba(255,255,255,0.12) 100% 100%)",
              }}
            >
              <div className="grid h-[86px] w-[86px] place-items-center rounded-full bg-[#102323] text-center">
                <span className="text-[12px] font-semibold text-[#99f0db]">{hasMembers ? `${activeMember?.score}%` : "0%"}</span>
                <span className="-mt-2 text-[10px] text-[#a9bfba]">live</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Link href={hasMembers ? "/upload" : "/family"} className="flex h-[74px] flex-col items-center justify-center gap-2 rounded-lg bg-white/9 text-[11px] font-semibold text-white hover:bg-white/14">
              <Icon name="upload" className="h-5 w-5 text-[#99f0db]" />
              {hasMembers ? "Upload report" : "Add member"}
            </Link>
            <Link href="/reports" className="flex h-[74px] flex-col items-center justify-center gap-2 rounded-lg bg-white/9 text-[11px] font-semibold text-white hover:bg-white/14">
              <Icon name="reports" className="h-5 w-5 text-[#99f0db]" />
              Reports
            </Link>
            <Link href="/analytics" className="flex h-[74px] flex-col items-center justify-center gap-2 rounded-lg bg-white/9 text-[11px] font-semibold text-white hover:bg-white/14">
              <Icon name="analytics" className="h-5 w-5 text-[#99f0db]" />
              Analytics
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#101c1c]">Needs attention</h2>
          <Link href="/analytics" className="text-[13px] font-bold text-[#087766]">
            View all
          </Link>
        </div>

        {attentionItems.length ? (
          <div className="mt-3 space-y-3">
            {attentionItems.map((item) => (
            <Link key={item.id} href={`/reports?reportId=${encodeURIComponent(item.id)}`} className="flex items-center gap-3 rounded-lg border border-[#e2ebe8] bg-white p-4 hover:border-[#a5dcd0]">
              <div className={`grid h-11 w-11 place-items-center rounded-lg ${item.tone === "coral" ? "bg-[#fff0ec] text-[#cc6044]" : "bg-[#eaf9f2] text-[#0a7d6e]"}`}>
                <span className="h-2.5 w-2.5 rounded-full bg-current" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-[#162523]">{item.label}</p>
                <p className="mt-1 text-[12px] text-[#7b8986]">{item.note}</p>
              </div>
              <div className="text-right text-[13px] font-bold text-[#162523]">{item.value}</div>
            </Link>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-[#c5d8d3] bg-white p-5">
            <p className="text-[14px] font-black text-[#162523]">No attention items</p>
            <p className="mt-2 text-[13px] text-[#65716f]">Upload reports and AI summaries will surface anything important here.</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#101c1c]">Recent reports</h2>
          <Link href="/reports" className="text-[13px] font-bold text-[#087766]">
            See all
          </Link>
        </div>

        {recentReports.length ? (
          <div className="mt-3 space-y-3">
          {recentReports.map((report) => (
            <Link key={report.id} href={`/reports?reportId=${encodeURIComponent(report.id)}`} className="flex items-center gap-3 rounded-lg border border-[#e2ebe8] bg-white p-4 hover:border-[#a5dcd0]">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#f1f6f4] text-[#087766]">
                <Icon name="reports" className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-[#162523]">{report.title}</p>
                <p className="mt-1 truncate text-[12px] text-[#7b8986]">
                  {report.lab} - {report.date}
                </p>
              </div>
              <span className="rounded-md bg-[#f1f6f4] px-2.5 py-1 text-[11px] font-bold text-[#52605d]">{report.status}</span>
            </Link>
          ))}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-[#c5d8d3] bg-white p-5">
            <p className="text-[14px] font-black text-[#162523]">No reports yet</p>
            <p className="mt-2 text-[13px] text-[#65716f]">Upload a report to start building this vault.</p>
          </div>
        )}
      </section>
    </MobileShell>
  );
}
