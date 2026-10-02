import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "@/api";
import { useAuth } from "@/auth-context";
import { Card, EmptyState, PrimaryButton, ScreenHeader } from "@/components";
import { colors, radius, shadows } from "@/theme";
import type { AppReport, ReportMarker } from "@/types";
import { useVault } from "@/vault-context";

type PickedFile = {
  enhanced?: boolean;
  mimeType: string;
  name: string;
  size?: number;
  uri: string;
};

type DocumentScannerModule = {
  enhanceImage: (uri: string) => Promise<PickedFile>;
  previewRemoteFile: (url: string, token: string, fileName: string) => Promise<boolean>;
  scan: () => Promise<PickedFile[]>;
};

const documentScanner = NativeModules.DocumentScanner as DocumentScannerModule | undefined;

function inferMimeType(name: string, rawMime?: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf") || rawMime === "application/pdf") return "application/pdf";
  if (lower.endsWith(".png") || rawMime === "image/png") return "image/png";
  if (lower.endsWith(".webp") || rawMime === "image/webp") return "image/webp";
  if (lower.match(/\.(jpe?g|heic|heif)$/) || rawMime?.startsWith("image/")) return "image/jpeg";
  return rawMime || "application/octet-stream";
}

function fileDataUrl(file: PickedFile) {
  return new Promise<string>((resolve, reject) => {
    fetch(file.uri)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(blob);
      })
      .catch(reject);
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
  const [isPreparing, setIsPreparing] = useState(false);
  const [step, setStep] = useState("");

  async function pickPhotoFromGallery() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow photo access to select report images.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ["images"],
        quality: 0.82,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `report-${Date.now()}.jpg`;
        const picked: PickedFile = {
          mimeType: asset.mimeType || inferMimeType(fileName, "image/jpeg"),
          name: fileName,
          size: asset.fileSize,
          uri: asset.uri,
        };
        setFile(picked);
      }
    } catch {
      Alert.alert("Gallery error", "Could not open photo library. Try Browse Files.");
    }
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: ["application/pdf", "image/*"],
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      const rawAsset = result.assets[0];
      const mimeType = inferMimeType(rawAsset.name, rawAsset.mimeType);
      const picked: PickedFile = {
        mimeType,
        name: rawAsset.name,
        size: rawAsset.size,
        uri: rawAsset.uri,
      };
      if (picked.mimeType.startsWith("image/") && documentScanner) {
        setIsPreparing(true);
        try {
          setFile(await documentScanner.enhanceImage(picked.uri));
        } catch {
          setFile(picked);
          Alert.alert(
            "Original image selected",
            "Automatic edge correction was unavailable, so MediVault kept the original image."
          );
        } finally {
          setIsPreparing(false);
        }
      } else {
        setFile(picked);
      }
    }
  }

  async function scanDocument() {
    if (Platform.OS !== "ios" || !documentScanner) {
      return Alert.alert(
        "Scanner unavailable",
        "Use Browse Files to select a clear report image or PDF on this device."
      );
    }
    setIsPreparing(true);
    try {
      const pages = await documentScanner.scan();
      if (pages.length) {
        setFile(pages[0]);
        if (pages.length > 1) {
          Alert.alert(
            "First page ready",
            `The scan contains ${pages.length} pages. This upload currently analyzes the first page; upload the remaining pages separately for complete extraction.`
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Document scan could not be completed.";
      if (!message.toLowerCase().includes("cancel")) {
        Alert.alert("Scanner unavailable", message);
      }
    } finally {
      setIsPreparing(false);
    }
  }

  async function submit() {
    if (!file || !activeMember || !token) return;
    if ((file.size || 0) > 20 * 1024 * 1024) {
      return Alert.alert(
        "File too large",
        "Please select a medical report smaller than 20 MB."
      );
    }
    setIsSaving(true);
    try {
      setStep("Encrypting and saving original document");
      const form = new FormData();
      form.append("file", {
        name: file.name,
        type: file.mimeType,
        uri: file.uri,
      } as unknown as Blob);

      const stored = await apiRequest<{
        fileId: string;
        fileMimeType: string;
        fileSizeBytes: number;
      }>("/files", { body: form, method: "POST" }, token);

      let analysis: {
        abnormal: number;
        aiConfidence: number;
        category: string;
        markers: ReportMarker[];
        parameters: number;
        status: string;
        summary: string;
        title: string;
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

      const isPdf = file.mimeType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isImage = file.mimeType.startsWith("image/") || Boolean(file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i));
      if (isImage || isPdf) {
        let analysisFile = file;
        if (isPdf) {
          if (!documentScanner) {
            throw new Error("PDF analysis is unavailable in this app build. Please update MediVault or upload a report image.");
          }
          setStep("Preparing the first PDF page for secure analysis");
          analysisFile = await documentScanner.enhanceImage(file.uri);
        }
        setStep("Extracting clinical biomarkers via AI vision");
        const dataUrl = await fileDataUrl(analysisFile);
        const resolvedMime = analysisFile.mimeType.startsWith("image/") ? analysisFile.mimeType : "image/jpeg";
        analysis = await apiRequest(
          "/analyze-report",
          {
            body: JSON.stringify({
              fileDataUrls: [dataUrl],
              fileName: file.name,
              lab,
              memberName: activeMember.name,
              mimeType: resolvedMime,
              originalMimeType: file.mimeType,
              reportKind: kind,
              title: title || file.name.replace(/\.[^.]+$/, ""),
            }),
            method: "POST",
          },
          token
        );
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

      setStep("Synchronizing private medical vault");
      await saveUploadedReport(report);
      if (analysis.aiConfidence === 0 && (!analysis.markers || analysis.markers.length <= 1)) {
        Alert.alert(
          "AI Analysis Notice",
          analysis.summary || "Report was saved, but AI could not extract biomarkers."
        );
      }
      router.replace({
        params: { reportId: report.id },
        pathname: "/(tabs)/reports",
      });
    } catch (error) {
      Alert.alert(
        "Report could not be uploaded",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setIsSaving(false);
      setStep("");
    }
  }

  if (!familyMembers.length) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <ScreenHeader eyebrow="New Record" title="Scan & Upload" />
        <View style={styles.content}>
          <Card>
            <EmptyState
              description="Every medical record requires a family profile so longitudinal trends and patient history stay correctly organized."
              icon="person-add-outline"
              title="Add a family profile first"
            />
          </Card>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingBottom: insets.bottom + 36,
          paddingTop: insets.top + 8,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <ScreenHeader
        eyebrow="AI-Powered Ingestion"
        subtitle="Automatic extraction for lab PDF and physical photos"
        title="Add Report"
      />

      <View style={styles.content}>
        {/* iOS Segmented Control */}
        <View style={styles.segment}>
          <Pressable
            onPress={() => setKind("medical")}
            style={[styles.segmentButton, kind === "medical" && styles.segmentActive]}
          >
            <Ionicons
              name="document-text-outline"
              size={15}
              color={kind === "medical" ? "#fff" : colors.muted}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentText,
                kind === "medical" && styles.segmentTextActive,
              ]}
            >
              Medical Report
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setKind("body_composition")}
            style={[
              styles.segmentButton,
              kind === "body_composition" && styles.segmentActive,
            ]}
          >
            <Ionicons
              name="body-outline"
              size={15}
              color={kind === "body_composition" ? "#fff" : colors.muted}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentText,
                kind === "body_composition" && styles.segmentTextActive,
              ]}
            >
              Body Composition
            </Text>
          </Pressable>
        </View>

        {/* Dropzone / Ingestion Card */}
        <Card style={styles.dropzoneCard}>
          <View style={styles.dropzoneHalo}>
            <View style={styles.dropzoneIconCircle}>
              <Ionicons
                name={file ? "checkmark-circle" : "cloud-upload-outline"}
                size={30}
                color={colors.primary}
              />
            </View>
          </View>

          <Text numberOfLines={2} style={styles.dropzoneTitle}>
            {file?.name || "Select PDF or capture photo"}
          </Text>
          <Text style={styles.dropzoneSubtitle}>
            {file
              ? `${file.mimeType} · ${
                  file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "ready"
                }${file.enhanced ? " · Auto-cropped & enhanced" : ""}`
              : "Scan with automatic borders, perspective correction and clarity enhancement. Originals remain encrypted."}
          </Text>

          {isPreparing ? (
            <View style={styles.preparingRow}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.preparingText}>Preparing a clear scan...</Text>
            </View>
          ) : null}

          {file && !isPreparing ? (
            <Pressable onPress={() => setFile(null)} style={styles.clearFileBadge}>
              <Ionicons name="trash-outline" size={13} color={colors.critical} />
              <Text style={styles.clearFileText}>Remove document</Text>
            </Pressable>
          ) : !isPreparing ? (
            <View style={styles.dropzoneActions}>
              <Pressable
                accessibilityLabel="Smart Scan"
                accessibilityRole="button"
                onPress={scanDocument}
                style={({ pressed }) => [
                  styles.pickerBtn,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Ionicons name="camera-outline" size={17} color={colors.primary} />
                <Text style={styles.pickerBtnText}>Camera</Text>
              </Pressable>

              <Pressable
                accessibilityLabel="Photo Gallery"
                accessibilityRole="button"
                onPress={pickPhotoFromGallery}
                style={({ pressed }) => [
                  styles.pickerBtn,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Ionicons name="images-outline" size={17} color={colors.primary} />
                <Text style={styles.pickerBtnText}>Photos</Text>
              </Pressable>

              <Pressable
                accessibilityLabel="Browse Files"
                accessibilityRole="button"
                onPress={pickDocument}
                style={({ pressed }) => [
                  styles.pickerBtn,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Ionicons name="folder-open-outline" size={17} color={colors.primary} />
                <Text style={styles.pickerBtnText}>Files / PDF</Text>
              </Pressable>
            </View>
          ) : null}
        </Card>

        {/* Form Fields */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Report Title</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="reader-outline" size={18} color={colors.muted} style={styles.inputIcon} />
            <TextInput
              onChangeText={setTitle}
              placeholder={
                kind === "body_composition"
                  ? "InBody / DEXA Body Composition"
                  : "e.g. Complete Blood Count (CBC)"
              }
              placeholderTextColor="#95A7A2"
              style={styles.textInput}
              value={title}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Laboratory / Clinic</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="business-outline" size={18} color={colors.muted} style={styles.inputIcon} />
            <TextInput
              onChangeText={setLab}
              placeholder="e.g. Metropolis Healthcare, Dr. Lal PathLabs"
              placeholderTextColor="#95A7A2"
              style={styles.textInput}
              value={lab}
            />
          </View>
        </View>

        {/* Profile Affinity Pill */}
        <Card style={styles.affinityCard}>
          <View style={styles.affinityLeft}>
            <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.affinityLabel}>ASSOCIATED PATIENT PROFILE</Text>
              <Text style={styles.affinityName}>{activeMember?.name}</Text>
              <Text style={styles.affinityMeta}>
                {activeMember?.relation} · Switch profile anytime from Family tab
              </Text>
            </View>
          </View>
        </Card>

        {/* Stepper Status during submission */}
        {step ? (
          <View style={styles.stepProgressCard}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.stepProgressText}>{step}...</Text>
          </View>
        ) : null}

        {/* Action Button */}
        <View style={{ marginTop: 4 }}>
          <PrimaryButton
            disabled={!file || isSaving}
            icon="shield-checkmark-outline"
            loading={isSaving}
            onPress={submit}
            title={isSaving ? "Ingesting & Analyzing..." : "Analyze & save to vault"}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  affinityCard: {
    backgroundColor: "#F2FAF7",
    borderColor: "rgba(13, 99, 82, 0.12)",
    padding: 14,
  },
  affinityLabel: {
    color: colors.primary,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  affinityLeft: {
    alignItems: "center",
    flexDirection: "row",
  },
  affinityMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  affinityName: {
    color: colors.ink,
    fontSize: 14.5,
    fontWeight: "800",
    marginTop: 2,
  },
  clearFileBadge: {
    alignItems: "center",
    backgroundColor: colors.criticalSoft,
    borderColor: "rgba(217, 72, 59, 0.2)",
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFileText: {
    color: colors.critical,
    fontSize: 11.5,
    fontWeight: "800",
  },
  content: {
    gap: 14,
    paddingHorizontal: 18,
  },
  dropzoneActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 18,
  },
  dropzoneCard: {
    alignItems: "center",
    borderColor: "rgba(13, 99, 82, 0.25)",
    borderStyle: "dashed",
    borderWidth: 1.5,
    paddingVertical: 26,
  },
  dropzoneHalo: {
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    marginBottom: 4,
    width: 64,
  },
  dropzoneIconCircle: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  dropzoneSubtitle: {
    color: colors.muted,
    fontSize: 11.5,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 290,
    textAlign: "center",
  },
  dropzoneTitle: {
    color: colors.ink,
    fontSize: 15.5,
    fontWeight: "800",
    marginTop: 10,
    textAlign: "center",
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 12.5,
    fontWeight: "800",
  },
  inputIcon: {
    marginRight: 8,
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1.2,
    flexDirection: "row",
    height: 50,
    paddingHorizontal: 14,
    ...shadows.soft,
  },
  pickerBtn: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1.2,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 18,
    ...shadows.soft,
  },
  pickerBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  preparingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  preparingText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  segment: {
    backgroundColor: "#EDF4F1",
    borderRadius: radius.control,
    flexDirection: "row",
    padding: 3.5,
  },
  segmentActive: {
    backgroundColor: colors.primaryDark,
    ...shadows.soft,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: radius.control - 2,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 40,
  },
  segmentText: {
    color: colors.muted,
    fontSize: 12.5,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#fff",
  },
  stepProgressCard: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: "rgba(13, 99, 82, 0.2)",
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    padding: 13,
  },
  stepProgressText: {
    color: colors.primary,
    fontSize: 12.5,
    fontWeight: "800",
  },
  textInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
});
