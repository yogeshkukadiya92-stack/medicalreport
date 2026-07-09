"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import type { AppReport, FamilyMember, ReportMarker, ReportStatus, VaultSnapshot } from "@/lib/vault-types";

export type { AppReport, FamilyMember, ReportMarker, ReportStatus } from "@/lib/vault-types";

type NewReportInput = {
  fileName: string;
  lab: string;
  memberId: string;
  title: string;
};

type ReportPatch = Partial<Pick<AppReport, "title" | "lab" | "category" | "status" | "summary" | "markers" | "abnormal" | "parameters" | "aiConfidence" | "fileId" | "fileMimeType" | "fileSizeBytes">>;
type ManualReportInput = {
  category: string;
  lab: string;
  markers: ReportMarker[];
  memberId: string;
  title: string;
};

type MemberDetails = Partial<Pick<FamilyMember, "age" | "bloodGroup" | "phone">>;

type AppDataContextValue = {
  activeMember: FamilyMember | null;
  activeMemberId: string | null;
  addMember: (name: string, relation: string, details?: MemberDetails) => void;
  addManualReport: (input: ManualReportInput) => AppReport;
  addReport: (input: NewReportInput) => AppReport;
  deleteMember: (memberId: string) => void;
  deleteReport: (reportId: string) => void;
  familyMembers: FamilyMember[];
  updateMember: (memberId: string, patch: Partial<Pick<FamilyMember, "name" | "relation" | "age" | "bloodGroup" | "phone">>) => void;
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
    source: report.source ?? "self_upload",
    summary: report.summary ?? "Analysis summary will appear after processing.",
  };
}

function normalizeMember(member: FamilyMember): FamilyMember {
  return {
    ...member,
    phone: typeof member.phone === "string" ? member.phone : "",
  };
}

function localReportsOnly(reports: AppReport[]) {
  return reports.filter((report) => report.source !== "lab");
}

function sameReportList(first: AppReport[], second: AppReport[]) {
  if (first.length !== second.length) return false;
  const firstIds = first.map((report) => `${report.id}:${report.createdAt ?? ""}:${report.summary ?? ""}`).sort();
  const secondIds = second.map((report) => `${report.id}:${report.createdAt ?? ""}:${report.summary ?? ""}`).sort();
  return firstIds.every((id, index) => id === secondIds[index]);
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { isConfigLoading, isConfigured: isAuthConfigured, session, status: authStatus } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [reports, setReports] = useState<AppReport[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);
  const cloudSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          activeMemberId?: string;
          familyMembers?: FamilyMember[];
          reports?: AppReport[];
        };
        if (Array.isArray(parsed.familyMembers)) setFamilyMembers(parsed.familyMembers.map(normalizeMember));
        if (Array.isArray(parsed.reports)) {
          setReports(
            parsed.reports
              .filter((report) => report.source !== "lab")
              .map((report) =>
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
    window.localStorage.setItem(storageKey, JSON.stringify({ activeMemberId, familyMembers, reports: localReportsOnly(reports) }));
  }, [activeMemberId, familyMembers, isHydrated, reports]);

  useEffect(() => {
    if (!isHydrated || isConfigLoading) return;

    if (!isAuthConfigured) {
      setIsCloudLoaded(true);
      return;
    }

    if (authStatus === "loading") return;

    if (authStatus !== "authenticated" || !session?.access_token) {
      setIsCloudLoaded(false);
      return;
    }

    let isCancelled = false;

    async function loadCloudVault() {
      let canSaveToCloud = false;
      try {
        const response = await fetch("/api/vault", {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });
        const result = (await response.json().catch(() => null)) as {
          vault?: VaultSnapshot | null;
        } | null;

        if (isCancelled) return;

        if (response.ok) {
          canSaveToCloud = true;
        }

        if (response.ok && result?.vault) {
          setFamilyMembers(result.vault.familyMembers.map(normalizeMember));
          setReports(result.vault.reports.map(normalizeReport));
          setActiveMemberId(result.vault.activeMemberId);
        }
      } finally {
        if (!isCancelled && canSaveToCloud) {
          setIsCloudLoaded(true);
        }
      }
    }

    loadCloudVault();

    return () => {
      isCancelled = true;
    };
  }, [authStatus, isAuthConfigured, isConfigLoading, isHydrated, session?.access_token]);

  useEffect(() => {
    if (!isHydrated || !isCloudLoaded || authStatus !== "authenticated" || !session?.access_token) return;

    if (cloudSaveTimerRef.current) {
      clearTimeout(cloudSaveTimerRef.current);
    }

    cloudSaveTimerRef.current = setTimeout(async () => {
      const response = await fetch("/api/vault", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activeMemberId, familyMembers, reports: localReportsOnly(reports) } satisfies VaultSnapshot),
      }).catch(() => null);

      if (!response?.ok) {
        // Local storage remains the immediate offline fallback when cloud sync is unavailable.
        return;
      }

      const result = (await response.json().catch(() => null)) as { vault?: VaultSnapshot } | null;
      if (result?.vault?.reports) {
        const mergedReports = result.vault.reports.map(normalizeReport);
        setReports((current) => (sameReportList(current, mergedReports) ? current : mergedReports));
      }
    }, 450);

    return () => {
      if (cloudSaveTimerRef.current) {
        clearTimeout(cloudSaveTimerRef.current);
      }
    };
  }, [activeMemberId, authStatus, familyMembers, isCloudLoaded, isHydrated, reports, session?.access_token]);

  useEffect(() => {
    if (!isHydrated || !isCloudLoaded || authStatus !== "authenticated" || !session?.access_token) return;

    let isCancelled = false;
    async function refreshLabReports() {
      const response = await fetch("/api/vault", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      }).catch(() => null);
      if (!response?.ok || isCancelled) return;
      const result = (await response.json().catch(() => null)) as { vault?: VaultSnapshot | null } | null;
      if (result?.vault?.reports) {
        const mergedReports = result.vault.reports.map(normalizeReport);
        setReports((current) => (sameReportList(current, mergedReports) ? current : mergedReports));
      }
    }

    const intervalId = window.setInterval(refreshLabReports, 30000);
    const onFocus = () => {
      refreshLabReports();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [authStatus, isCloudLoaded, isHydrated, session?.access_token]);

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
      addMember: (name, relation, details) => {
        const cleanName = name.trim();
        if (!cleanName) return;
        const nextMember: FamilyMember = {
          id: `${cleanName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          name: cleanName,
          relation: relation.trim() || "Family",
          score: 0,
          bloodGroup: details?.bloodGroup?.trim() || "Unknown",
          age: details?.age ?? 0,
          phone: details?.phone?.trim() || "",
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
          source: "self_upload",
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
          source: "self_upload",
          parameters: 0,
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
      deleteReport: (reportId) => setReports((current) => current.filter((report) => report.id !== reportId || report.source === "lab")),
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
          current.map((report) => (report.id === reportId && report.source !== "lab" ? { ...report, ...patch } : report)),
        ),
      markReviewed: (reportId) =>
        setReports((current) =>
          current.map((report) =>
            report.id === reportId && report.source !== "lab" ? { ...report, abnormal: 0, status: "Reviewed" as ReportStatus } : report,
          ),
        ),
      reports,
      reportsForActiveMember,
      setActiveMemberId,
      toggleStar: (reportId) =>
        setReports((current) =>
          current.map((report) => (report.id === reportId && report.source !== "lab" ? { ...report, starred: !report.starred } : report)),
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
