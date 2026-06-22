// Family Members API Service — talks to the MediVault backend.
import type { FamilyMember } from '@/lib/types';
import apiClient from '@/lib/api-client';

export const familyAPI = {
  async listMembers(): Promise<FamilyMember[]> {
    const res = await apiClient.get('/family-members');
    return res.data.data;
  },

  async addMember(data: Partial<FamilyMember>): Promise<FamilyMember> {
    const res = await apiClient.post('/family-members', data);
    return res.data.data;
  },

  async updateMember(id: string, data: Partial<FamilyMember>): Promise<FamilyMember> {
    const res = await apiClient.patch(`/family-members/${id}`, data);
    return res.data.data;
  },

  async deleteMember(id: string): Promise<void> {
    await apiClient.delete(`/family-members/${id}`);
  },

  async setDefaultMember(id: string): Promise<FamilyMember> {
    const res = await apiClient.patch(`/family-members/${id}/set-default`);
    return res.data.data;
  },
};
