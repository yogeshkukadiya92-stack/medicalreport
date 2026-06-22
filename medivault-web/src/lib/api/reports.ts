// Reports API Service — talks to the MediVault backend.
import type { MedicalReport, HealthSummary, PaginatedResponse } from '@/lib/types';
import apiClient from '@/lib/api-client';

export const reportsAPI = {
  async listReports(filters?: Record<string, any>): Promise<PaginatedResponse<MedicalReport>> {
    const res = await apiClient.get('/reports', { params: filters });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  async getReport(id: string): Promise<MedicalReport> {
    const res = await apiClient.get(`/reports/${id}`);
    return res.data.data;
  },

  async createReport(data: any): Promise<MedicalReport> {
    const res = await apiClient.post('/reports', data);
    return res.data.data;
  },

  async updateReport(id: string, data: any): Promise<MedicalReport> {
    const res = await apiClient.patch(`/reports/${id}`, data);
    return res.data.data;
  },

  async deleteReport(id: string): Promise<void> {
    await apiClient.delete(`/reports/${id}`);
  },

  async getHealthSummary(memberId?: string): Promise<HealthSummary> {
    const res = await apiClient.get('/reports/health-summary', {
      params: { family_member_id: memberId },
    });
    return res.data.data;
  },

  async getTrends(param: string, memberId?: string): Promise<any[]> {
    const res = await apiClient.get(`/reports/trends/${encodeURIComponent(param)}`, {
      params: { family_member_id: memberId },
    });
    return res.data.data;
  },

  async confirmReport(id: string): Promise<void> {
    await apiClient.post(`/reports/${id}/confirm`);
  },
};
