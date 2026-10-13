import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export async function prepareReportAnalysis(file: { uri: string; name: string; mimeType?: string }, fileId: string) {
  const mimeType = file.mimeType || (/\.pdf$/i.test(file.name) ? "application/pdf" : /\.png$/i.test(file.name) ? "image/png" : "image/jpeg");
  if (mimeType === "application/pdf") return { fileId, mimeType, originalMimeType: mimeType };
  if (Platform.OS === "web") {
    const blob = await (await fetch(file.uri)).blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Report photo could not be read."));
      reader.readAsDataURL(blob);
    });
    return { fileDataUrls: [dataUrl], mimeType, originalMimeType: mimeType };
  }
  const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
  return { fileDataUrls: [`data:${mimeType};base64,${base64}`], mimeType, originalMimeType: mimeType };
}
