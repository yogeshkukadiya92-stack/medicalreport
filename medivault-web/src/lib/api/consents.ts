// Consents API Service — talks to the MediVault backend.
import apiClient from '@/lib/api-client';

export const consentsAPI = {
  async grant(consentType: string, version = '1.0'): Promise<void> {
    await apiClient.post('/consents', {
      consent_type: consentType,
      consent_version: version,
      is_granted: true,
    });
  },

  async getConsents(): Promise<any[]> {
    const res = await apiClient.get('/consents');
    return res.data.data;
  },

  async revoke(consentType: string, version = '1.0'): Promise<void> {
    await apiClient.post('/consents/revoke', {
      consent_type: consentType,
      consent_version: version,
    });
  },
};
