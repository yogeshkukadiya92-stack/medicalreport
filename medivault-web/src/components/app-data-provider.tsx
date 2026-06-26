"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  score: number;
  bloodGroup: string;
  age: number;
};

export type ReportStatus = "Reviewed" | "Needs review" | "Watch" | "Normal" | "Processing";

export type ReportMarker = {
  name: string;
  value: string;
  range: string;
  status: "Normal" | "High" | "Low" | "Watch";
};

export type AppReport = {
  id: string;
  title: string;
  category: string;
  lab: string;
  date: string;
  memberId: string;
  memberName: string;
  fileName: string;
  parameters: number;
  abnormal: number;
  status: ReportStatus;
  starred: boolean;
  summary: string;
  markers: ReportMarker[];
  aiConfidence: number;
  createdAt: number;
};

type NewReportInput = {
  fileName: string;
  lab: string;
  memberId: string;
  title: string;
};

type ReportPatch = Partial<Pick<AppReport, "title" | "lab" | "category" | "status" | "summary" | "markers" | "abnormal" | "parameters" | "aiConfidence">>;
type ManualReportInput = {
  category: string;
  lab: string;
  markers: ReportMarker[];
  memberId: string;
  title: string;
};

type AppDataContextValue = {
  activeMember: FamilyMember | null;
  activeMemberId: string | null;
  addMember: (name: string, relation: string) => void;
  addManualReport: (input: ManualReportInput) => AppReport;
  addReport: (input: NewReportInput) => AppReport;
  deleteMember: (memberId: string) => void;
  deleteReport: (reportId: string) => void;
  familyMembers: FamilyMember[];
  updateMember: (memberId: string, patch: Partial<Pick<FamilyMember, "name" | "relation" | "age" | "bloodGroup">>) => void;
  updateReport: (reportId: string, patch: ReportPatch) => void;
  markReviewed: (reportId: string) => void;
  reports: AppReport[];
  reportsForActiveMember: AppReport[];
  setActiveMemberId: (memberId: string | null) => void;
  toggleStar: (reportId: string) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);
const storageKey = "medivault-app-data-v2";

function todayLabel() {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date());
}

function finishProcessing(report: AppReport): AppReport {
  return {
    ...report,
    abnormal: 1,
    aiConfidence: 0,
    category: "General",
    markers: [{ name: "Report", value: "Uploaded", range: "AI analysis pending", status: "Watch" }],
    parameters: 1,
    status: "Watch",
    summary: "AI analysis did not finish. Check OPENAI_API_KEY in Railway Variables, then upload again or review manually.",
  };
}

function normalizeReport(report: AppReport): AppReport {
  return {
    ...report,
    aiConfidence: report.aiConfidence ?? 0,
    category: report.category ?? "General",
    markers: Array.isArray(report.markers) ? report.markers : [],
    summary: report.summary ?? "Analysis summary will appear after processing.",
  };
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [reports, setReports] = useState<AppReport[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          activeMemberId?: string;
          familyMembers?: FamilyMember[];
          reports?: AppReport[];
        };
        if (Array.isArray(parsed.familyMembers)) setFamilyMembers(parsed.familyMembers);
        if (Array.isArray(parsed.reports)) {
          setReports(
            parsed.reports.map((report) =>
              report.status === "Processing" && Date.now() - (report.createdAt ?? Number(report.id) ?? Date.now()) > 3500
                ? finishProcessing(normalizeReport({ ...report, createdAt: report.createdAt ?? Number(report.id) ?? Date.now() }))
                : normalizeReport({ ...report, createdAt: report.createdAt ?? Number(report.id) ?? Date.now() }),
            ),
          );
        }
        if (parsed.activeMemberId) setActiveMemberId(parsed.activeMemberId);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ activeMemberId, familyMembers, reports }));
  }, [activeMemberId, familyMembers, isHydrated, reports]);

  useEffect(() => {
    if (!isHydrated || !familyMembers.length) return;
    if (!activeMemberId || !familyMembers.some((member) => member.id === activeMemberId)) {
      setActiveMemberId(familyMembers[0].id);
    }
  }, [activeMemberId, familyMembers, isHydrated]);

  const activeMember = activeMemberId
    ? familyMembers.find((member) => member.id === activeMemberId) ?? familyMembers[0] ?? null
    : familyMembers[0] ?? null;
  const reportsForActiveMember = activeMember ? reports.filter((report) => report.memberId === activeMember.id) : [];

  const value = useMemo<AppDataContextValue>(
    () => ({
      activeMember,
      activeMemberId,
      addMember: (name, relation) => {
        const cleanName = name.trim();
        if (!cleanName) return;
        const nextMember: FamilyMember = {
          id: `${cleanName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          name: cleanName,
          relation: relation.trim() || "Family",
          score: 80,
          bloodGroup: "Unknown",
          age: 0,
        };
        setFamilyMembers((current) => [...current, nextMember]);
        setActiveMemberId(nextMember.id);
      },
      addManualReport: (input) => {
        const member = familyMembers.find((item) => item.id === input.memberId) ?? activeMember ?? familyMembers[0];
        if (!member) {
          throw new Error("Cannot add report without a family member");
        }
        const markers = input.markers.filter((marker) => marker.name.trim() && marker.value.trim());
        const abnormal = markers.filter((marker) => marker.status !== "Normal").length;
        const nextReport: AppReport = {
          id: `${Date.now()}`,
          title: input.title.trim() || "Manual health values",
          category: input.category.trim() || "Manual",
          lab: input.lab.trim() || "Manual entry",
          date: todayLabel(),
          memberId: member.id,
          memberName: member.name,
          fileName: "Manual entry",
          parameters: markers.length,
          abnormal,
          status: abnormal ? "Needs review" : "Reviewed",
          starred: false,
          summary: abnormal
            ? `Manual entry has ${abnormal} value${abnormal > 1 ? "s" : ""} marked for review.`
            : "Manual entry saved with values in normal range.",
          markers,
          aiConfidence: 0,
          createdAt: Date.now(),
        };
        setReports((current) => [nextReport, ...current]);
        return nextReport;
      },
      addReport: (input) => {
        const member = familyMembers.find((item) => item.id === input.memberId) ?? activeMember ?? familyMembers[0];
        if (!member) {
          throw new Error("Cannot add report without a family member");
        }
        const nextReport: AppReport = {
          id: `${Date.now()}`,
          title: input.title.trim() || "Medical Report",
          category: "Analyzing",
          lab: input.lab.trim() || "Uploaded report",
          date: todayLabel(),
          memberId: member.id,
          memberName: member.name,
          fileName: input.fileName,
          parameters: 8,
          abnormal: 0,
          status: "Processing",
          starred: false,
          summary: "AI analysis is reading the report and preparing a doctor-ready summary.",
          markers: [],
          aiConfidence: 0,
          createdAt: Date.now(),
        };
        setReports((current) => [nextReport, ...current]);
        return nextReport;
      },
      deleteMember: (memberId) => {
        const remaining = familyMembers.filter((member) => member.id !== memberId);
        setFamilyMembers(remaining);
        setActiveMemberId((activeId) => (activeId === memberId ? remaining[0]?.id ?? null : activeId));
        setReports((current) => current.filter((report) => report.memberId !== memberId));
      },
      deleteReport: (reportId) => setReports((current) => current.filter((report) => report.id !== reportId)),
      familyMembers,
      updateMember: (memberId, patch) => {
        setFamilyMembers((current) =>
          current.map((member) => (member.id === memberId ? { ...member, ...patch } : member)),
        );
        setReports((current) =>
          current.map((report) =>
            report.memberId === memberId && patch.name
              ? { ...report, memberName: patch.name }
              : report,
          ),
        );
      },
      updateReport: (reportId, patch) =>
        setReports((current) =>
          current.map((report) => (report.id === reportId ? { ...report, ...patch } : report)),
        ),
      markReviewed: (reportId) =>
        setReports((current) =>
          current.map((report) =>
            report.id === reportId ? { ...report, abnormal: 0, status: "Reviewed" as ReportStatus } : report,
          ),
        ),
      reports,
      reportsForActiveMember,
      setActiveMemberId,
      toggleStar: (reportId) =>
        setReports((current) =>
          current.map((report) => (report.id === reportId ? { ...report, starred: !report.starred } : report)),
        ),
    }),
    [activeMember, activeMemberId, familyMembers, reports, reportsForActiveMember],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}
