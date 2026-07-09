import type { ExtractedValue, HealthSummary, MedicalReport, PaginatedResponse } from "@/lib/types";
import type { AppReport, ReportMarker } from "@/lib/vault-types";
import { createClientId, isoFromCreatedAt, loadVaultSnapshot, saveVaultSnapshot } from "@/lib/api/vault-service";

function toExtractedValue(marker: ReportMarker, reportId: string, index: number): ExtractedValue {
  const statusMap: Record<ReportMarker["status"], ExtractedValue["status"]> = {
    High: "high",
    Low: "low",
    Normal: "normal",
    Watch: "borderline",
  };
  return {
    id: `${reportId}-value-${index}`,
    parameter_name: marker.name,
    value: marker.value,
    reference_range_text: marker.range,
    status: statusMap[marker.status],
    is_user_verified: true,
    is_user_edited: false,
  };
}

function toMedicalReport(report: AppReport): MedicalReport {
  return {
    id: report.id,
    family_member_id: report.memberId,
    family_member_name: report.memberName,
    report_type: report.reportType ?? report.category,
    report_title: report.title,
    report_date: report.date,
    lab_name: report.labName ?? report.lab,
    doctor_name: report.doctorName,
    notes: report.summary,
    source: report.source ?? "self_upload",
    processing_status: report.status,
    ai_confidence_score: report.aiConfidence,
    is_starred: report.starred,
    tags: [report.category].filter(Boolean),
    created_at: isoFromCreatedAt(report.createdAt),
    files: report.fileId
      ? [
          {
            id: report.fileId,
            original_filename: report.fileName,
            mime_type: report.fileMimeType ?? "application/octet-stream",
            file_size_bytes: report.fileSizeBytes ?? 0,
            upload_status: "stored",
          },
        ]
      : [],
    extracted_values: report.markers.map((marker, index) => toExtractedValue(marker, report.id, index)),
  };
}

function matchesFilters(report: AppReport, filters: Record<string, unknown> = {}) {
  const memberId = String(filters.family_member_id ?? filters.memberId ?? "");
  const status = String(filters.status ?? "");
  const source = String(filters.source ?? "");
  const q = String(filters.q ?? filters.search ?? "").trim().toLowerCase();
  if (memberId && report.memberId !== memberId) return false;
  if (status && report.status !== status) return false;
  if (source && (report.source ?? "self_upload") !== source) return false;
  if (!q) return true;
  return `${report.title} ${report.lab} ${report.category} ${report.fileName} ${report.summary}`.toLowerCase().includes(q);
}

export const reportsAPI = {
  async listReports(filters: Record<string, unknown> = {}): Promise<PaginatedResponse<MedicalReport>> {
    const vault = await loadVaultSnapshot();
    const page = Number(filters.page ?? 1);
    const perPage = Number(filters.per_page ?? 20);
    const filtered = vault.reports.filter((report) => matchesFilters(report, filters));
    const start = Math.max(0, (page - 1) * perPage);
    const data = filtered.slice(start, start + perPage).map(toMedicalReport);
    return {
      data,
      pagination: {
        page,
        per_page: perPage,
        total_items: filtered.length,
        total_pages: Math.max(1, Math.ceil(filtered.length / perPage)),
        has_next: start + perPage < filtered.length,
        has_prev: page > 1,
      },
    };
  },

  async getReport(id: string): Promise<MedicalReport> {
    const vault = await loadVaultSnapshot();
    const report = vault.reports.find((item) => item.id === id);
    if (!report) throw new Error("Report not found");
    return toMedicalReport(report);
  },

  async createReport(data: Partial<MedicalReport>): Promise<MedicalReport> {
    const vault = await loadVaultSnapshot();
    const memberId = data.family_member_id ?? vault.activeMemberId ?? vault.familyMembers[0]?.id;
    const member = vault.familyMembers.find((item) => item.id === memberId);
    if (!member) throw new Error("A family member is required before creating a report.");
    const now = Date.now();
    const report: AppReport = {
      id: createClientId("report"),
      title: data.report_title?.trim() || "Medical Report",
      category: data.report_type?.trim() || "General",
      lab: data.lab_name?.trim() || "Uploaded report",
      date: data.report_date || new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(now)),
      memberId: member.id,
      memberName: member.name,
      fileName: data.files?.[0]?.original_filename || "Manual entry",
      fileId: data.files?.[0]?.id,
      fileMimeType: data.files?.[0]?.mime_type,
      fileSizeBytes: data.files?.[0]?.file_size_bytes,
      source: "self_upload",
      parameters: data.extracted_values?.length ?? 0,
      abnormal: data.extracted_values?.filter((value) => value.status !== "normal").length ?? 0,
      status: data.processing_status === "Reviewed" ? "Reviewed" : "Needs review",
      starred: Boolean(data.is_starred),
      summary: data.notes ?? "Report saved.",
      markers:
        data.extracted_values?.map((value) => ({
          name: value.parameter_name,
          range: value.reference_range_text ?? "",
          status: value.status === "high" ? "High" : value.status === "low" ? "Low" : value.status === "normal" ? "Normal" : "Watch",
          value: value.unit ? `${value.value} ${value.unit}` : value.value,
        })) ?? [],
      aiConfidence: data.ai_confidence_score ?? 0,
      createdAt: now,
    };
    await saveVaultSnapshot({ ...vault, reports: [report, ...vault.reports] });
    return toMedicalReport(report);
  },

  async updateReport(id: string, data: Partial<MedicalReport>): Promise<MedicalReport> {
    const vault = await loadVaultSnapshot();
    let updated: AppReport | null = null;
    const reports = vault.reports.map((report) => {
      if (report.id !== id || report.source === "lab") return report;
      updated = {
        ...report,
        title: data.report_title?.trim() || report.title,
        category: data.report_type?.trim() || report.category,
        lab: data.lab_name?.trim() || report.lab,
        summary: data.notes ?? report.summary,
        starred: data.is_starred ?? report.starred,
      };
      return updated;
    });
    if (!updated) throw new Error("Report not found or cannot be edited.");
    await saveVaultSnapshot({ ...vault, reports });
    return toMedicalReport(updated);
  },

  async deleteReport(id: string): Promise<void> {
    const vault = await loadVaultSnapshot();
    await saveVaultSnapshot({ ...vault, reports: vault.reports.filter((report) => report.id !== id || report.source === "lab") });
  },

  async getHealthSummary(memberId?: string): Promise<HealthSummary> {
    const vault = await loadVaultSnapshot();
    const activeMemberId = memberId ?? vault.activeMemberId ?? vault.familyMembers[0]?.id;
    const member = vault.familyMembers.find((item) => item.id === activeMemberId);
    const reports = vault.reports.filter((report) => !activeMemberId || report.memberId === activeMemberId);
    const attentionItems = reports.flatMap((report) =>
      report.markers
        .filter((marker) => marker.status !== "Normal")
        .map((marker, index) => toExtractedValue(marker, report.id, index)),
    );
    return {
      family_member_name: member?.name ?? "Family member",
      total_reports: reports.length,
      values_needing_attention: attentionItems.length,
      latest_report_date: reports[0]?.date,
      attention_items: attentionItems,
      recent_reports: reports.slice(0, 3).map(toMedicalReport),
    };
  },

  async getTrends(param: string, memberId?: string): Promise<Array<{ date: string; status: string; value: string }>> {
    const vault = await loadVaultSnapshot();
    return vault.reports
      .filter((report) => !memberId || report.memberId === memberId)
      .flatMap((report) =>
        report.markers
          .filter((marker) => marker.name.toLowerCase() === param.toLowerCase())
          .map((marker) => ({ date: report.date, status: marker.status.toLowerCase(), value: marker.value })),
      );
  },

  async confirmReport(id: string): Promise<void> {
    const vault = await loadVaultSnapshot();
    await saveVaultSnapshot({
      ...vault,
      reports: vault.reports.map((report) =>
        report.id === id && report.source !== "lab" ? { ...report, abnormal: 0, status: "Reviewed" } : report,
      ),
    });
  },
};
