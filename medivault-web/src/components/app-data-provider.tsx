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

type AppDataContextValue = {
  activeMember: FamilyMember | null;
  activeMemberId: string | null;
  addMember: (name: string, relation: string) => void;
  addReport: (input: NewReportInput) => AppReport;
  deleteMember: (memberId: string) => void;
  deleteReport: (reportId: string) => void;
  familyMembers: FamilyMember[];
  updateMember: (memberId: string, patch: Partial<Pick<FamilyMember, "name" | "relation" | "age" | "bloodGroup">>) => void;
  updateReport: (reportId: string, patch: Partial<Pick<AppReport, "title" | "lab" | "category" | "status" | "summary">>) => void;
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
  const text = `${report.title} ${report.fileName}`.toLowerCase();
  const isSugar = text.includes("hba1c") || text.includes("sugar") || text.includes("diabetes");
  const isVitamin = text.includes("vitamin");
  const isLipid = text.includes("lipid") || text.includes("cholesterol");
  const isBlood = text.includes("blood") || text.includes("cbc");
  const needsReview = isSugar || isVitamin || isLipid || isBlood;
  const category = isSugar ? "Diabetes" : isVitamin ? "Vitamin" : isLipid ? "Lipid" : isBlood ? "Blood" : "General";
  const markers: ReportMarker[] = isSugar
    ? [
        { name: "HbA1c", value: "7.1%", range: "< 5.7%", status: "High" },
        { name: "Fasting sugar", value: "142 mg/dL", range: "70-110 mg/dL", status: "High" },
        { name: "Creatinine", value: "0.9 mg/dL", range: "0.7-1.3 mg/dL", status: "Normal" },
      ]
    : isVitamin
      ? [
          { name: "Vitamin D", value: "18 ng/mL", range: "30-100 ng/mL", status: "Low" },
          { name: "Calcium", value: "9.3 mg/dL", range: "8.5-10.5 mg/dL", status: "Normal" },
        ]
      : isLipid
        ? [
            { name: "LDL", value: "115 mg/dL", range: "< 100 mg/dL", status: "Watch" },
            { name: "Triglycerides", value: "168 mg/dL", range: "< 150 mg/dL", status: "High" },
            { name: "HDL", value: "46 mg/dL", range: "> 40 mg/dL", status: "Normal" },
          ]
        : isBlood
          ? [
              { name: "Hemoglobin", value: "11.8 g/dL", range: "12-16 g/dL", status: "Low" },
              { name: "WBC", value: "7,800/uL", range: "4,000-11,000/uL", status: "Normal" },
              { name: "Platelets", value: "2.4 lakh/uL", range: "1.5-4.5 lakh/uL", status: "Normal" },
            ]
          : [
              { name: "Key values", value: "Detected", range: "Report range", status: "Normal" },
            ];
  const abnormal = markers.filter((marker) => marker.status !== "Normal").length;

  return {
    ...report,
    abnormal,
    aiConfidence: needsReview ? 91 : 78,
    category,
    markers,
    parameters: Math.max(report.parameters, markers.length + 5),
    status: abnormal ? "Needs review" : "Reviewed",
    summary: abnormal
      ? `${category} report has ${abnormal} value${abnormal > 1 ? "s" : ""} outside range. Keep this ready for doctor review.`
      : `${category} report looks stable from the detected values.`,
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

  useEffect(() => {
    if (!isHydrated || !reports.some((report) => report.status === "Processing")) return;

    const timer = window.setTimeout(() => {
      setReports((current) =>
        current.map((report) => (report.status === "Processing" ? finishProcessing(report) : report)),
      );
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [isHydrated, reports]);

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
