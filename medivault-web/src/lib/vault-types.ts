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
  fileId?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;
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
