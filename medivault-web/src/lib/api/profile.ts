// Profile API Service — talks to the MediVault backend.
import type { Profile } from '@/lib/types';
import apiClient from '@/lib/api-client';

export const profileAPI = {
  async getProfile(): Promise<Profile> {
    const res = await apiClient.get('/profile');
    return res.data.data;
  },

  async createProfile(data: Partial<Profile>): Promise<Profile> {
    const res = await apiClient.post('/profile', data);
    return res.data.data;
  },

  async updateProfile(data: Partial<Profile>): Promise<Profile> {
    const res = await apiClient.patch('/profile', data);
    return res.data.data;
  },
};
