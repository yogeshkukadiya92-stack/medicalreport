// Files API Service
// MVP: Returns dummy data. Replace with real API calls when backend is ready.

export const filesAPI = {
  // Get presigned upload URL from backend
  async getUploadURL(
    filename: string,
    mimeType: string,
    fileSize: number
  ): Promise<{ file_id: string; upload_url: string; expires_in_seconds: number }> {
    // TODO: Replace with real API call to get presigned S3 URL
    // const response = await apiClient.post('/files/upload-url', {
    //   filename,
    //   mime_type: mimeType,
    //   file_size_bytes: fileSize,
    // });

    return {
      file_id: `file_${Date.now()}`,
      upload_url: `https://s3-presigned-url-${Date.now()}`,
      expires_in_seconds: 600,
    };
  },

  // Confirm file upload to backend
  async confirmUpload(fileId: string, checksum: string): Promise<void> {
    // TODO: Replace with real API call
    // await apiClient.post(`/files/${fileId}/confirm`, {
    //   checksum_sha256: checksum,
    // });

    return Promise.resolve();
  },

  // Get signed download URL
  async getFileURL(fileId: string): Promise<string> {
    // TODO: Replace with real API call to get signed download URL
    // const response = await apiClient.get(`/files/${fileId}/url`);

    return `https://signed-download-url-${fileId}`;
  },
};
