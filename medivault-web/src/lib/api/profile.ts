// Profile API Service
// MVP: Returns dummy data. Replace with real API calls when backend is ready.

import type { Profile } from '@/lib/types';

export const profileAPI = {
  // Get user profile
  async getProfile(): Promise<Profile> {
    // TODO: Replace with real API call
    // return apiClient.get('/profile');

    return {
      id: '550e8400-e29b-41d4-a716-446655440099',
      full_name: 'Rajesh Kumar',
      date_of_birth: '1981-03-15',
      gender: 'male',
      blood_group: 'B+',
      known_conditions: ['diabetes', 'thyroid'],
    };
  },

  // Create user profile
  async createProfile(data: any): Promise<Profile> {
    // TODO: Replace with real API call
    // return apiClient.post('/profile', data);

    return {
      ...data,
      id: `profile_${Date.now()}`,
    };
  },

  // Update user profile
  async updateProfile(data: any): Promise<Profile> {
    // TODO: Replace with real API call
    // return apiClient.patch('/profile', data);

    return {
      id: '550e8400-e29b-41d4-a716-446655440099',
      ...data,
    };
  },
};
