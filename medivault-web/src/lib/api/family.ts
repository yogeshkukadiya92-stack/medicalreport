// Family Members API Service
// MVP: Returns dummy data. Replace with real API calls when backend is ready.

import type { FamilyMember } from '@/lib/types';
import { dummyFamilyMembers } from '@/data/dummy';

export const familyAPI = {
  // List all family members
  async listMembers(): Promise<FamilyMember[]> {
    // TODO: Replace with real API call
    // return apiClient.get('/family-members');

    return dummyFamilyMembers;
  },

  // Get single member
  async getMember(id: string): Promise<FamilyMember> {
    // TODO: Replace with real API call
    // return apiClient.get(`/family-members/${id}`);

    const member = dummyFamilyMembers.find((m) => m.id === id);
    if (!member) throw new Error('Member not found');
    return member;
  },

  // Add new family member
  async addMember(data: any): Promise<FamilyMember> {
    // TODO: Replace with real API call
    // return apiClient.post('/family-members', data);

    return {
      ...data,
      id: `member_${Date.now()}`,
      report_count: 0,
      is_default: false,
    };
  },

  // Update family member
  async updateMember(id: string, data: any): Promise<FamilyMember> {
    // TODO: Replace with real API call
    // return apiClient.patch(`/family-members/${id}`, data);

    const member = dummyFamilyMembers.find((m) => m.id === id);
    if (!member) throw new Error('Member not found');
    return { ...member, ...data };
  },

  // Delete family member
  async deleteMember(id: string): Promise<void> {
    // TODO: Replace with real API call
    // return apiClient.delete(`/family-members/${id}`);

    return Promise.resolve();
  },

  // Set default/active member
  async setDefaultMember(id: string): Promise<FamilyMember> {
    // TODO: Replace with real API call
    // return apiClient.patch(`/family-members/${id}/set-default`);

    const member = dummyFamilyMembers.find((m) => m.id === id);
    if (!member) throw new Error('Member not found');
    return { ...member, is_default: true };
  },
};
