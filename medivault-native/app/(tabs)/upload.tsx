import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "@/api";
import { useAuth } from "@/auth-context";
import { Card, EmptyState, PrimaryButton, ScreenHeader } from "@/components";
import { colors } from "@/theme";
import type { AppReport, ReportMarker } from "@/types";
import { useVault } from "@/vault-context";

type PickedFile = { mimeType: string; name: string; size?: number; uri: string };

function fileDataUrl(file: PickedFile) {
  return new Promise<string>((resolve, reject) => {
    fetch(file.uri).then((response) => response.blob()).then((blob) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    }).catch(reject);
  });
}

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { activeMember, familyMembers, saveUploadedReport } = useVault();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [title, setTitle] = useState("");
  const [lab, setLab] = useState("");
  const [kind, setKind] = useState<"medical" | "body_composition">("medical");
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState("");

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: ["application/pdf", "image/*"] });
    if (!result.canceled) setFile({
      mimeType: result.assets[0].mimeType || "application/octet-stream",
      name: result.assets[0].name,
      size: result.assets[0].size,
      uri: result.assets[0].uri,
    });
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Camera permission required", "Allow camera access to scan a report.");
    const result = await ImagePicker.launchCameraAsync({ cameraType: ImagePicker.CameraType.back, quality: 0.9 });
    if (!result.canceled) setFile({
      mimeType: result.assets[0].mimeType || "image/jpeg",
      name: result.assets[0].fileName || `report-${Date.now()}.jpg`,
      size: result.assets[0].fileSize,
      uri: result.assets[0].uri,
    });
  }

  async function submit() {
    if (!file || !activeMember || !token) return;
    if ((file.size || 0) > 20 * 1024 * 1024) return Alert.alert("File too large", "Select a report smaller than 20 MB.");
    setIsSaving(true);
    try {
      setStep("Saving original report");
      const form = new FormData();
      form.append("file", { name: file.name, type: file.mimeType, uri: file.uri } as unknown as Blob);
      const stored = await apiRequest<{ fileId: string; fileMimeType: string; fileSizeBytes: number }>("/files", { body: form, method: "POST" }, token);
      let analysis: {
        abnormal: number; aiConfidence: number; category: string; markers: ReportMarker[];
        parameters: number; status: string; summary: string; title: string;
      } = {
        abnormal: 0,
        aiConfidence: 0,
        category: kind === "body_composition" ? "Body Composition" : "General",
        markers: [],
        parameters: 0,
        status: "Watch",
        summary: "Original PDF saved. Open the report to review or add structured values.",
        title: title || file.name.replace(/\.[^.]+$/, ""),
      };
      if (file.mimeType.startsWith("image/")) {
        setStep("Extracting medical values");
        const dataUrl = await fileDataUrl(file);
        analysis = await apiRequest("/analyze-report", {
          body: JSON.stringify({
            fileDataUrls: [dataUrl],
            fileName: file.name,
            lab,
            memberName: activeMember.name,
            mimeType: file.mimeType,
            originalMimeType: file.mimeType,
            reportKind: kind,
            title: title || file.name.replace(/\.[^.]+$/, ""),
          }),
          method: "POST",
        }, token);
      }
      const report: AppReport = {
        abnormal: analysis.abnormal,
        category: analysis.category,
        createdAt: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        fileId: stored.fileId,
        fileMimeType: stored.fileMimeType,
        fileName: file.name,
        id: `native-${Date.now()}`,
        lab: lab || "Self upload",
        markers: analysis.markers,
        memberId: activeMember.id,
        memberName: activeMember.name,
        parameters: analysis.parameters,
        source: "self_upload",
        starred: false,
        status: analysis.status,
        summary: analysis.summary,
        title: analysis.title,
      };
      setStep("Syncing private vault");
      await saveUploadedReport(report);
      router.replace({ pathname: "/(tabs)/reports", params: { reportId: report.id } });
    } catch (error) {
      Alert.alert("Report could not be added", error instanceof Error ? error.message : "Try again.");
    } finally {
      setIsSaving(false);
      setStep("");
    }
  }

  if (!familyMembers.length) return <View style={[styles.screen, { paddingTop: insets.top + 8 }]}><ScreenHeader eyebrow="New medical record" title="Add report" /><View style={styles.content}><Card><EmptyState icon="person-add-outline" title="Add a family profile first" description="Every report needs a profile so history and trends stay correctly grouped." /></Card></View></View>;

  return (
    <ScrollView keyboardShouldPersistTaps="handled" style={styles.screen} contentContainerStyle={{ paddingBottom: 30, paddingTop: insets.top + 8 }}>
      <ScreenHeader eyebrow="New medical record" title="Add report" />
      <View style={styles.content}>
        <View style={styles.segment}><Pressable onPress={() => setKind("medical")} style={[styles.segmentButton, kind === "medical" && styles.active]}><Text style={[styles.segmentText, kind === "medical" && styles.activeText]}>Medical report</Text></Pressable><Pressable onPress={() => setKind("body_composition")} style={[styles.segmentButton, kind === "body_composition" && styles.active]}><Text style={[styles.segmentText, kind === "body_composition" && styles.activeText]}>Body composition</Text></Pressable></View>
        <Card style={styles.picker}><View style={styles.uploadIcon}><Ionicons name={file ? "checkmark" : "cloud-upload-outline"} size={28} color={colors.primary} /></View><Text numberOfLines={2} style={styles.fileTitle}>{file?.name || "Select PDF or report photo"}</Text><Text style={styles.fileCopy}>{file ? `${file.mimeType} · ${file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "ready"}` : "Original stored privately. Photos are analyzed automatically."}</Text><View style={styles.actions}><Pressable onPress={takePhoto} style={styles.secondary}><Ionicons name="camera-outline" size={17} color={colors.primary} /><Text style={styles.secondaryText}>Camera</Text></Pressable><Pressable onPress={pickDocument} style={styles.secondary}><Ionicons name="folder-open-outline" size={17} color={colors.primary} /><Text style={styles.secondaryText}>Files</Text></Pressable></View></Card>
        <TextInput onChangeText={setTitle} placeholder={kind === "body_composition" ? "BMI & Body Composition" : "Report title"} placeholderTextColor="#8C9C98" style={styles.input} value={title} />
        <TextInput onChangeText={setLab} placeholder="Lab, clinic or doctor" placeholderTextColor="#8C9C98" style={styles.input} value={lab} />
        <Card><Text style={styles.profileLabel}>SAVING FOR</Text><Text style={styles.profileName}>{activeMember?.name}</Text><Text style={styles.profileMeta}>Change active profile from the Family tab.</Text></Card>
        {step ? <Text style={styles.progress}>{step}...</Text> : null}
        <PrimaryButton disabled={!file || isSaving} icon="shield-checkmark-outline" onPress={submit} title={isSaving ? "Processing securely..." : "Analyze & save"} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: 9, marginTop: 16 },
  active: { backgroundColor: colors.primaryDark },
  activeText: { color: "#fff" },
  content: { gap: 12, paddingHorizontal: 16 },
  fileCopy: { color: colors.muted, fontSize: 10, fontWeight: "600", lineHeight: 16, marginTop: 6, textAlign: "center" },
  fileTitle: { color: colors.ink, fontSize: 15, fontWeight: "900", marginTop: 12, textAlign: "center" },
  input: { backgroundColor: "#fff", borderColor: colors.stroke, borderRadius: 7, borderWidth: 1, color: colors.ink, fontSize: 12, fontWeight: "700", height: 48, paddingHorizontal: 13 },
  picker: { alignItems: "center", borderStyle: "dashed", paddingVertical: 24 },
  profileLabel: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  profileMeta: { color: colors.muted, fontSize: 9, fontWeight: "600", marginTop: 4 },
  profileName: { color: colors.ink, fontSize: 14, fontWeight: "900", marginTop: 5 },
  progress: { backgroundColor: colors.primarySoft, borderRadius: 7, color: colors.primary, fontSize: 11, fontWeight: "800", padding: 11, textAlign: "center" },
  screen: { backgroundColor: colors.background, flex: 1 },
  secondary: { alignItems: "center", borderColor: colors.stroke, borderRadius: 7, borderWidth: 1, flexDirection: "row", gap: 7, minHeight: 42, paddingHorizontal: 15 },
  secondaryText: { color: colors.primary, fontSize: 11, fontWeight: "900" },
  segment: { backgroundColor: "#E5EEEB", borderRadius: 7, flexDirection: "row", padding: 3 },
  segmentButton: { alignItems: "center", borderRadius: 5, flex: 1, justifyContent: "center", minHeight: 40 },
  segmentText: { color: colors.muted, fontSize: 11, fontWeight: "900" },
  uploadIcon: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: 8, height: 56, justifyContent: "center", width: 56 },
});
