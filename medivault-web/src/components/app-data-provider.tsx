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

export type AppReport = {
  id: string;
  title: string;
  lab: string;
  date: string;
  memberId: string;
  memberName: string;
  fileName: string;
  parameters: number;
  abnormal: number;
  status: ReportStatus;
  starred: boolean;
  createdAt: number;
};

type NewReportInput = {
  fileName: string;
  lab: string;
  memberId: string;
  title: string;
};

type AppDataContextValue = {
  activeMember: FamilyMember;
  activeMemberId: string;
  addMember: (name: string, relation: string) => void;
  addReport: (input: NewReportInput) => AppReport;
  deleteReport: (reportId: string) => void;
  familyMembers: FamilyMember[];
  markReviewed: (reportId: string) => void;
  reports: AppReport[];
  reportsForActiveMember: AppReport[];
  setActiveMemberId: (memberId: string) => void;
  toggleStar: (reportId: string) => void;
};

const seedFamilyMembers: FamilyMember[] = [
  { id: "rajesh", name: "Rajesh", relation: "You", score: 85, bloodGroup: "B+", age: 45 },
  { id: "priya", name: "Priya", relation: "Spouse", score: 92, bloodGroup: "A+", age: 40 },
  { id: "mohan", name: "Mohan", relation: "Parent", score: 68, bloodGroup: "O+", age: 72 },
];

const seedReports: AppReport[] = [
  {
    id: "cbc",
    title: "Complete Blood Count",
    lab: "Apollo Diagnostics",
    date: "20 Jun",
    memberId: "rajesh",
    memberName: "Rajesh",
    fileName: "cbc-jun.pdf",
    parameters: 20,
    abnormal: 3,
    status: "Needs review",
    starred: false,
    createdAt: 1718841600000,
  },
  {
    id: "thyroid",
    title: "Thyroid Function Test",
    lab: "Lal Path Labs",
    date: "10 May",
    memberId: "rajesh",
    memberName: "Rajesh",
    fileName: "thyroid-may.pdf",
    parameters: 3,
    abnormal: 0,
    status: "Reviewed",
    starred: true,
    createdAt: 1715299200000,
  },
  {
    id: "lipid",
    title: "Lipid Profile",
    lab: "Apollo Diagnostics",
    date: "22 Apr",
    memberId: "rajesh",
    memberName: "Rajesh",
    fileName: "lipid-apr.pdf",
    parameters: 5,
    abnormal: 2,
    status: "Watch",
    starred: false,
    createdAt: 1713744000000,
  },
];

const AppDataContext = createContext<AppDataContextValue | null>(null);
const storageKey = "medivault-app-data-v1";

function todayLabel() {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date());
}

function finishProcessing(report: AppReport): AppReport {
  const text = `${report.title} ${report.fileName}`.toLowerCase();
  const needsReview =
    text.includes("blood") ||
    text.includes("cbc") ||
    text.includes("hba1c") ||
    text.includes("sugar") ||
    text.includes("vitamin") ||
    text.includes("lipid");

  return {
    ...report,
    abnormal: needsReview ? 2 : 0,
    parameters: needsReview ? Math.max(report.parameters, 12) : Math.max(report.parameters, 6),
    status: needsReview ? "Needs review" : "Reviewed",
  };
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [familyMembers, setFamilyMembers] = useState(seedFamilyMembers);
  const [reports, setReports] = useState(seedReports);
  const [activeMemberId, setActiveMemberId] = useState(seedFamilyMembers[0].id);
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
        if (Array.isArray(parsed.familyMembers)) setFamilyMembers(parsed.familyMembers.length ? parsed.familyMembers : seedFamilyMembers);
        if (Array.isArray(parsed.reports)) {
          setReports(
            parsed.reports.map((report) =>
              report.status === "Processing" && Date.now() - (report.createdAt ?? Number(report.id) ?? Date.now()) > 3500
                ? finishProcessing({ ...report, createdAt: report.createdAt ?? Number(report.id) ?? Date.now() })
                : { ...report, createdAt: report.createdAt ?? Number(report.id) ?? Date.now() },
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
    if (!isHydrated || !reports.some((report) => report.status === "Processing")) return;

    const timer = window.setTimeout(() => {
      setReports((current) =>
        current.map((report) => (report.status === "Processing" ? finishProcessing(report) : report)),
      );
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [isHydrated, reports]);

  const activeMember = familyMembers.find((member) => member.id === activeMemberId) ?? familyMembers[0];
  const reportsForActiveMember = reports.filter((report) => report.memberId === activeMember.id);

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
        const member = familyMembers.find((item) => item.id === input.memberId) ?? activeMember;
        const nextReport: AppReport = {
          id: `${Date.now()}`,
          title: input.title.trim() || "Medical Report",
          lab: input.lab.trim() || "Uploaded report",
          date: todayLabel(),
          memberId: member.id,
          memberName: member.name,
          fileName: input.fileName,
          parameters: 8,
          abnormal: 0,
          status: "Processing",
          starred: false,
          createdAt: Date.now(),
        };
        setReports((current) => [nextReport, ...current]);
        return nextReport;
      },
      deleteReport: (reportId) => setReports((current) => current.filter((report) => report.id !== reportId)),
      familyMembers,
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
