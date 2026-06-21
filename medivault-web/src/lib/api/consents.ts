// Consents API Service
// MVP: Returns dummy data. Replace with real API calls when backend is ready.

export const consentsAPI = {
  // Grant consent
  async grant(consentType: string, version: string): Promise<void> {
    // TODO: Replace with real API call
    // await apiClient.post('/consents', {
    //   consent_type: consentType,
    //   consent_version: version,
    //   is_granted: true,
    // });

    return Promise.resolve();
  },

  // Get current consents
  async getConsents(): Promise<any[]> {
    // TODO: Replace with real API call
    // return apiClient.get('/consents');

    return [
      {
        consent_type: 'ai_processing',
        consent_version: '1.0',
        is_granted: true,
        granted_at: new Date().toISOString(),
      },
      {
        consent_type: 'terms_of_service',
        consent_version: '1.0',
        is_granted: true,
        granted_at: new Date().toISOString(),
      },
      {
        consent_type: 'privacy_policy',
        consent_version: '1.0',
        is_granted: true,
        granted_at: new Date().toISOString(),
      },
    ];
  },

  // Revoke consent
  async revoke(consentType: string): Promise<void> {
    // TODO: Replace with real API call
    // await apiClient.post('/consents/revoke', {
    //   consent_type: consentType,
    // });

    return Promise.resolve();
  },
};
