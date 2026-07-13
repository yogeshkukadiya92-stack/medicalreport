import type { LabClient, LabProfile, LabReport, LabRole } from "@/lib/vault-types";

export type AdminTaskPriority = "low" | "medium" | "high" | "urgent";
export type AdminTaskStatus = "open" | "in_progress" | "completed";
export type AdminTaskType = "follow_up" | "critical" | "report" | "payment" | "general";

export type AdminTask = {
  actionHref?: string;
  assignedTo?: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  createdAt: string;
  createdByUserId?: string;
  dueDate: string;
  id: string;
  labId: string;
  note?: string;
  priority: AdminTaskPriority;
  source: "manual" | "system";
  status: AdminTaskStatus;
  title: string;
  type: AdminTaskType;
  updatedAt: string;
};

export type AdminClientSummary = LabClient & {
  abnormalReports: number;
  appEmail?: string;
  appLinked: boolean;
  appUserId?: string;
  claimedReports: number;
  latestReportAt?: string;
  latestReportDate?: string;
  openTasks: number;
  reportCount: number;
  unclaimedReports: number;
};

export type AdminReportRow = LabReport & {
  criticalValues: number;
  deliveryState: "claimed" | "unclaimed" | "not_linked";
};

export type AdminDashboardPayload = {
  generatedAt: string;
  lab: LabProfile;
  metrics: {
    criticalPending: number;
    flaggedToday: number;
    openTasks: number;
    overdueTasks: number;
    patientAppLinked: number;
    publishedTotal: number;
    reportsToday: number;
    totalClients: number;
    totalStaff: number;
    unclaimedReports: number;
  };
  operations: {
    auditEvents: number;
    failedJobs: number;
    normalizedReports: number;
    queuedJobs: number;
  };
  recentClients: AdminClientSummary[];
  recentReports: AdminReportRow[];
  roleCounts: Record<LabRole, number>;
  tasks: AdminTask[];
  trend: Array<{ abnormal: number; date: string; reports: number }>;
};

export type AdminClientsPayload = {
  clients: AdminClientSummary[];
  lab: LabProfile;
  page: number;
  pageSize: number;
  total: number;
};

export type AdminClientAccount = {
  createdAt: string;
  email: string;
  id: string;
  name?: string;
  phone?: string;
  updatedAt: string;
};

export type AdminClientDetailPayload = {
  account: AdminClientAccount | null;
  audit: Array<{ action: string; actorUserId?: string; createdAt: string; id?: string; note?: string }>;
  client: AdminClientSummary;
  consents: Array<{ consent_type?: string; is_granted?: boolean; updated_at?: string }>;
  invoices: Array<{ amount?: number; createdAt?: string; id?: string; status?: string }>;
  lab: LabProfile;
  orders: Array<{
    accessionNumber?: string;
    createdAt?: string;
    id?: string;
    priority?: string;
    sampleType?: string;
    stage?: string;
    testName?: string;
  }>;
  patientVault: {
    familyMembers: number;
    uploadedReports: number;
  } | null;
  reports: AdminReportRow[];
  tasks: AdminTask[];
};

export type AdminReportsPayload = {
  lab: LabProfile;
  page: number;
  pageSize: number;
  reports: AdminReportRow[];
  total: number;
};

export type AdminTasksPayload = {
  clients: Array<Pick<LabClient, "id" | "name" | "phone">>;
  lab: LabProfile;
  summary: {
    completed: number;
    dueToday: number;
    open: number;
    overdue: number;
  };
  tasks: AdminTask[];
};
