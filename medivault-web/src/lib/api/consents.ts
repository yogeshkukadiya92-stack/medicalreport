import apiClient from "@/lib/api-client";

export type ConsentRecord = {
  consent_type: string;
  consent_version: string;
  granted_at?: string | null;
  is_granted: boolean;
  updated_at?: string;
};

export const consentsAPI = {
  async grant(consentType: string, version: string): Promise<void> {
    await apiClient.post("/consents", {
      consent_type: consentType,
      consent_version: version,
      is_granted: true,
    });
  },

  async getConsents(): Promise<ConsentRecord[]> {
    const response = await apiClient.get<{ consents: ConsentRecord[] }>("/consents");
    return response.data.consents;
  },

  async revoke(consentType: string): Promise<void> {
    await apiClient.post("/consents", {
      consent_type: consentType,
      is_granted: false,
    });
  },
};
