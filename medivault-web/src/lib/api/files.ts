import apiClient from "@/lib/api-client";

export const filesAPI = {
  async uploadFile(file: File): Promise<{ fileId: string; fileMimeType: string; fileName: string; fileSizeBytes: number }> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/files", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async getUploadURL(
    _filename: string,
    _mimeType: string,
    _fileSize: number,
  ): Promise<{ file_id: string; upload_url: string; expires_in_seconds: number }> {
    throw new Error("Presigned upload URLs are not configured. Use filesAPI.uploadFile(file) to store reports in MongoDB GridFS.");
  },

  async confirmUpload(_fileId: string, _checksum: string): Promise<void> {
    throw new Error("Upload confirmation is not required for direct MongoDB GridFS uploads.");
  },

  async getFileURL(fileId: string): Promise<string> {
    if (!fileId) throw new Error("File id is required.");
    return `/api/files/${encodeURIComponent(fileId)}`;
  },
};
