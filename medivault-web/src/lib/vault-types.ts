export type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  score: number;
  bloodGroup: string;
  age: number;
  phone?: string;
};

export type ReportStatus = "Reviewed" | "Needs review" | "Watch" | "Normal" | "Processing";
export type ReportSource = "self_upload" | "lab";

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
  fileId?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;
  source?: ReportSource;
  labId?: string;
  labName?: string;
  labReportId?: string;
  clientPhone?: string;
  publishedAt?: string;
  createdByLabUserId?: string;
  doctorName?: string;
  accessionNumber?: string;
  sampleCollectedAt?: string;
  reportType?: string;
  parameters: number;
  abnormal: number;
  status: ReportStatus;
  starred: boolean;
  summary: string;
  markers: ReportMarker[];
  aiConfidence: number;
  createdAt: number;
};

export type VaultSnapshot = {
  activeMemberId: string | null;
  familyMembers: FamilyMember[];
  reports: AppReport[];
};

export type LabRole = "lab_admin" | "lab_staff" | "pathologist" | "technician" | "cashier" | "collector";

export type LabProfile = {
  id: string;
  name: string;
  bookingSlug?: string;
  phone?: string;
  address?: string;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type LabUser = {
  id: string;
  userId: string;
  labId: string;
  role: LabRole;
  name?: string;
  createdAt: string;
  updatedAt: string;
};

export type LabClient = {
  id: string;
  labId: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  age?: number;
  gender?: string;
  createdAt: string;
  updatedAt: string;
};

export type LabReportStatus = "draft" | "published" | "unclaimed";

export type LabOrderStatus =
  | "ordered"
  | "accessioned"
  | "sample_collected"
  | "sample_received"
  | "sample_rejected"
  | "in_analysis"
  | "ready_for_verification"
  | "verified"
  | "reported"
  | "cancelled";

export type LabSampleEventType = "barcode_printed" | "collected" | "received" | "rejected" | "aliquoted" | "transferred";

export type LabBillingStatus = "draft" | "issued" | "part_paid" | "paid" | "refunded" | "void";

export type LabDeliveryChannel = "whatsapp" | "sms" | "email";

export type LabReportValue = {
  id: string;
  labId: string;
  labReportId: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: ReportMarker["status"];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type LabReport = {
  id: string;
  labId: string;
  labName: string;
  labReportId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  normalizedClientPhone: string;
  reportType: string;
  reportDate: string;
  title: string;
  status: LabReportStatus;
  values: LabReportValue[];
  abnormal: number;
  parameters: number;
  summary: string;
  fileId?: string;
  fileName?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;
  createdByLabUserId: string;
  doctorName?: string;
  accessionNumber?: string;
  sampleCollectedAt?: string;
  duplicateOfReportId?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type LabReportAuditLog = {
  id: string;
  labId: string;
  labReportId: string;
  action: "create" | "update" | "publish" | "delete";
  actorUserId: string;
  note: string;
  createdAt: string;
};

export type LabTemplateTest = {
  name: string;
  unit: string;
  referenceRange: string;
};

export type LabTemplate = {
  id: string;
  name: string;
  category: string;
  tests: LabTemplateTest[];
};
