// User & Auth Types
export interface User {
  id: string;
  phone: string;
  full_name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  known_conditions: string[];
}

export interface FamilyMember {
  id: string;
  full_name: string;
  relation: string;
  age?: number;
  gender?: string;
  blood_group?: string;
  known_conditions: string[];
  is_default: boolean;
  report_count: number;
}

// Report Types
export interface MedicalReport {
  id: string;
  family_member_id: string;
  family_member_name: string;
  report_type?: string;
  report_title?: string;
  report_date?: string;
  lab_name?: string;
  doctor_name?: string;
  notes?: string;
  source: string;
  processing_status: string;
  ai_confidence_score?: number;
  is_starred: boolean;
  tags: string[];
  created_at: string;
  files?: UploadedFile[];
  extracted_values?: ExtractedValue[];
}

export interface UploadedFile {
  id: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  page_number?: number;
  upload_status: string;
}

export interface ExtractedValue {
  id: string;
  parameter_name: string;
  value: string;
  unit?: string;
  reference_range_low?: number;
  reference_range_high?: number;
  reference_range_text?: string;
  status: 'normal' | 'borderline' | 'high' | 'low' | 'critical';
  is_user_verified: boolean;
  is_user_edited: boolean;
  original_ai_value?: string;
  confidence_score?: number;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  is_new_user: boolean;
  has_profile: boolean;
  has_consent: boolean;
}

// Form Types
export interface LoginFormData {
  phone: string;
}

export interface OTPFormData {
  otp: string;
}

export interface ProfileFormData {
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  known_conditions: string[];
}

export interface ReportFormData {
  report_type?: string;
  report_date?: string;
  lab_name?: string;
  doctor_name?: string;
  notes?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Health Summary
export interface HealthSummary {
  family_member_name: string;
  total_reports: number;
  values_needing_attention: number;
  latest_report_date?: string;
  attention_items: ExtractedValue[];
  recent_reports: MedicalReport[];
}
