// Reports API Service
// MVP: Returns dummy data. Replace with real API calls when backend is ready.

import type { MedicalReport, HealthSummary, PaginatedResponse } from '@/lib/types';
import { dummyReports, dummyHealthSummary } from '@/data/dummy';

export const reportsAPI = {
  // List all reports with pagination
  async listReports(filters?: any): Promise<PaginatedResponse<MedicalReport>> {
    // TODO: Replace with real API call
    // return apiClient.get('/reports', { params: filters });

    return {
      data: dummyReports,
      pagination: {
        page: 1,
        per_page: 20,
        total_items: dummyReports.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    };
  },

  // Get single report detail
  async getReport(id: string): Promise<MedicalReport> {
    // TODO: Replace with real API call
    // return apiClient.get(`/reports/${id}`);

    const report = dummyReports.find((r) => r.id === id);
    if (!report) throw new Error('Report not found');
    return report;
  },

  // Create new report
  async createReport(data: any): Promise<MedicalReport> {
    // TODO: Replace with real API call
    // return apiClient.post('/reports', data);

    return {
      ...data,
      id: `report_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
  },

  // Update report metadata
  async updateReport(id: string, data: any): Promise<MedicalReport> {
    // TODO: Replace with real API call
    // return apiClient.patch(`/reports/${id}`, data);

    const report = dummyReports.find((r) => r.id === id);
    if (!report) throw new Error('Report not found');
    return { ...report, ...data };
  },

  // Delete report
  async deleteReport(id: string): Promise<void> {
    // TODO: Replace with real API call
    // return apiClient.delete(`/reports/${id}`);

    return Promise.resolve();
  },

  // Get health summary
  async getHealthSummary(memberId?: string): Promise<HealthSummary> {
    // TODO: Replace with real API call
    // return apiClient.get('/reports/health-summary', { params: { family_member_id: memberId } });

    return dummyHealthSummary;
  },

  // Get parameter trends
  async getTrends(param: string, memberId?: string): Promise<any[]> {
    // TODO: Replace with real API call
    // return apiClient.get(`/reports/trends/${param}`, { params: { family_member_id: memberId } });

    // Return dummy trend data
    const baseValues: { [key: string]: number } = {
      HbA1c: 6.5,
      'Vitamin D': 25,
      'Fasting Blood Sugar': 130,
    };

    const base = baseValues[param] || 5;
    return Array.from({ length: 6 }, (_, i) => ({
      date: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      value: (base + (Math.random() - 0.5) * 2).toFixed(1),
      status: base > 6 ? 'high' : 'normal',
    }));
  },

  // Confirm/verify report
  async confirmReport(id: string): Promise<void> {
    // TODO: Replace with real API call
    // return apiClient.post(`/reports/${id}/confirm`);

    return Promise.resolve();
  },
};
