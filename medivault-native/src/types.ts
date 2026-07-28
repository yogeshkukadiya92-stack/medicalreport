export type ReportMarker = {
  name: string;
  range: string;
  status: "Normal" | "High" | "Low" | "Watch";
  value: string;
};

export type AppReport = {
  abnormal: number;
  category: string;
  createdAt: number;
  date: string;
  fileId?: string;
  fileMimeType?: string;
  fileName: string;
  id: string;
  lab: string;
  markers: ReportMarker[];
  memberId: string;
  memberName: string;
  parameters: number;
  source?: "self_upload" | "lab";
  starred: boolean;
  status: string;
  summary: string;
  title: string;
};

export type FamilyMember = {
  age: number;
  bloodGroup: string;
  id: string;
  name: string;
  phone?: string;
  relation: string;
  score: number;
};

export type VaultSnapshot = {
  activeMemberId: string | null;
  familyMembers: FamilyMember[];
  reports: AppReport[];
};

export type AuthUser = {
  email: string;
  id: string;
  name?: string;
  phone?: string;
};
