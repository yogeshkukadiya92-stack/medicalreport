import { Platform } from "react-native";

export async function reportUploadForm(file: { uri: string; name: string; mimeType?: string }) {
  const form = new FormData();
  if (Platform.OS === "web") {
    const response = await fetch(file.uri);
    if (!response.ok) throw new Error("The selected file could not be read. Please select it again.");
    form.append("file", await response.blob(), file.name);
  } else {
    form.append("file", { uri: file.uri, name: file.name, type: file.mimeType || "application/pdf" } as unknown as Blob);
  }
  return form;
}
