// Files API Service — talks to the MediVault backend.
import apiClient from '@/lib/api-client';

export const filesAPI = {
  async getUploadURL(
    filename: string,
    mimeType: string,
    fileSize: number
  ): Promise<{ file_id: string; upload_url: string; expires_in_seconds: number }> {
    const res = await apiClient.post('/files/upload-url', {
      filename,
      mime_type: mimeType,
      file_size_bytes: fileSize,
    });
    return res.data.data;
  },

  async confirmUpload(fileId: string, checksum: string): Promise<void> {
    await apiClient.post(`/files/${fileId}/confirm`, {
      checksum_sha256: checksum,
    });
  },

  async getFileURL(fileId: string): Promise<string> {
    const res = await apiClient.get(`/files/${fileId}/url`);
    return res.data.data.download_url;
  },
};
