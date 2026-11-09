import { reportUploadForm } from "@/report-upload";
import { matchesReportSearch } from "@/report-search";
import { medicalSourcesForReport } from "@/medical-sources";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { prepareReportAnalysis } from "@/prepare-report";
import { measuredMarkers } from "@/report-analysis";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  KeyboardAvoidingView,
  Linking,
  Platform,
  NativeModules,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL, apiRequest } from "@/api";
import { useAuth } from "@/auth-context";
import { Card, EmptyState, PrimaryButton, ScreenHeader, StatusPill } from "@/components";
import { colors, radius, shadows } from "@/theme";
import type { AppReport } from "@/types";
import { useVault } from "@/vault-context";

const CATEGORIES = [
  "All",
  "Complete Blood Count",
  "Lipid Profile",
  "Diabetes",
  "Thyroid",
  "Body Composition",
];

type DocumentPreviewModule = {
  readReportDataUrl?: (uri: string) => Promise<string>;
  enhanceImage: (uri: string) => Promise<{ uri: string; mimeType: string }>;
  previewRemoteFile: (url: string, token: string, fileName: string) => Promise<boolean>;
};

const documentPreview = NativeModules.DocumentScanner as DocumentPreviewModule | undefined;

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ reportId?: string }>();
  const { token } = useAuth();
  const { activeMember, reports, updateReport } = useVault();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selected, setSelected] = useState<AppReport | null>(null);
  const [recipient, setRecipient] = useState("");
  const [analysisStep, setAnalysisStep] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  useEffect(() => { setAnalysisError(""); }, [selected?.id]);
  const [analyzing, setAnalyzing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareError, setShareError] = useState("");
  useEffect(() => { setShareUrl(""); setShareError(""); }, [selected?.id]);

  const memberReports = reports.filter(
    (report) => !activeMember || report.memberId === activeMember.id
  );

  const filtered = useMemo(() => {
    return memberReports.filter((report) => {
      const matchesSearch = matchesReportSearch(report, search);
      const matchesCat =
        selectedCategory === "All" ||
        report.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        report.title.toLowerCase().includes(selectedCategory.toLowerCase());
      return matchesSearch && matchesCat;
    });
  }, [memberReports, search, selectedCategory]);

  useEffect(() => {
    if (params.reportId) {
      setSelected(reports.find((item) => item.id === params.reportId && (!activeMember || item.memberId === activeMember.id)) ?? null);
    }
  }, [params.reportId, reports, activeMember?.id]);

  useEffect(() => {
    setSelected((current) => current && activeMember && current.memberId !== activeMember.id ? null : current);
    setRecipient("");
  }, [activeMember?.id]);

  function closeReport() {
    setSelected(null);
    router.setParams({ reportId: undefined });
  }

  async function extractSavedParameters() {
    if (!selected?.fileId || !token) return;
    const report = selected;
    setAnalysisError("");
    setAnalyzing(true);
    setAnalysisStep("Extracting saved report parameters...");
    try {
      const result = await apiRequest<Partial<AppReport>>("/analyze-report", {
        method: "POST", body: JSON.stringify({
          fileId: report.fileId, fileName: report.fileName, title: report.title,
          lab: report.lab, memberName: report.memberName,
          reportKind: /inbody|body composition/i.test(report.title + report.category) ? "body_composition" : "medical",
        }),
      }, token);
      const markers = measuredMarkers(result.markers);
      if (!markers.length) throw new Error(result.summary || "No parameters could be read. Retry with a clearer report photo.");
      const updated = { ...report, ...result, id: report.id, fileId: report.fileId, markers, parameters: markers.length } as AppReport;
      await updateReport(updated);
      setSelected(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please retry.";
      setAnalysisError(message);
      if (Platform.OS !== "web") Alert.alert("Parameters could not be extracted", message);
    } finally { setAnalyzing(false); }
  }

  async function retryAnalysis(fromPhotos = false) {
    if (!selected || !token) return;
    const report = selected;
    let file: { uri: string; name: string; mimeType?: string };
    if (fromPhotos) {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      file = { uri: asset.uri, name: asset.fileName || "report.jpg", mimeType: asset.mimeType || "image/jpeg" };
    } else {
      const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: ["application/pdf", "image/*"] });
      if (picked.canceled || !picked.assets?.[0]) return;
      file = picked.assets[0];
    }
    setAnalysisError("");
    setAnalyzing(true);
    setAnalysisStep("Saving original...");
    try {
      const form = await reportUploadForm(file);
      const stored = await apiRequest<{ fileId: string; fileMimeType: string }>("/files", { method: "POST", body: form }, token);
      const attached = { ...report, ...stored, fileName: file.name };
      await updateReport(attached);
      setSelected(attached);
      try {
        setAnalysisStep("Reading report...");
        const prepared = await prepareReportAnalysis(file, stored.fileId);
        setAnalysisStep("Extracting measured values...");
        const result = await apiRequest<Partial<AppReport>>("/analyze-report", { method: "POST", body: JSON.stringify({
          ...prepared, fileName: file.name, title: report.title, lab: report.lab,
          memberName: report.memberName,
          reportKind: /inbody|body composition/i.test(report.title + report.category) ? "body_composition" : "medical",
        }) }, token);
        const markers = measuredMarkers(result.markers);
        if (!markers.length) throw new Error(result.summary && !/Report analyzed/i.test(result.summary) ? result.summary : "No measured values were detected. Try a clearer original report.");
        const updated = { ...attached, ...result, id: report.id, markers, parameters: markers.length } as AppReport;
        await updateReport(updated);
        setSelected(updated);
      } catch (error) {
        const summary = error instanceof Error ? error.message : "Extraction failed. Please retry.";
        setAnalysisError(summary);
        const failed = { ...attached, status: "Needs review", summary };
        await updateReport(failed);
        setSelected(failed);
        Alert.alert("Original saved; extraction needs attention", summary);
      }
    } catch (error) {
      Alert.alert("Report could not be saved", error instanceof Error ? error.message : "Please try again.");
    } finally { setAnalyzing(false); }
  }

  async function shareReport() {
    if (!selected || !token) return;
    setSharing(true);
    setShareError("");
    try {
      const result = await apiRequest<{ url: string }>(
        "/shares",
        {
          body: JSON.stringify({
            expiresInHours: 24 * 7,
            recipientLabel: recipient,
            reportId: selected.id,
          }),
          method: "POST",
        },
        token
      );
      setShareUrl(result.url);
      if (Platform.OS !== "web") await Share.share({
        message: `MediVault secure clinical report link (expires in 7 days): ${result.url}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      setShareError(message);
      Alert.alert("Report could not be shared", message);
    } finally {
      setSharing(false);
    }
  }

  async function openOriginalReport() {
    if (!selected?.fileId || !token) return;
    try {
      if (Platform.OS === "web") {
        const response = await fetch(`${API_URL}/files/${encodeURIComponent(selected.fileId)}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("The original report could not be downloaded. Please retry.");
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement("a");
        link.href = url;
        link.download = selected.fileName || "medical-report.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return;
      }
      if (!documentPreview) {
        if (!await Sharing.isAvailableAsync() || !FileSystem.cacheDirectory) {
          throw new Error("File preview is unavailable on this device.");
        }
        const safeName = (selected.fileName || "medical-report.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
        const previewDirectory = `${FileSystem.cacheDirectory}medivault-previews/`;
        await FileSystem.makeDirectoryAsync(previewDirectory, { intermediates: true });
        const localUri = `${previewDirectory}${Date.now()}-${safeName}`;
        let handedOff = false;
        try {
          const downloaded = await FileSystem.downloadAsync(`${API_URL}/files/${encodeURIComponent(selected.fileId)}`, localUri, { headers: { Authorization: `Bearer ${token}` } });
          if (downloaded.status !== 200) throw new Error("The report could not be downloaded. Please retry.");
          await Sharing.shareAsync(downloaded.uri, { mimeType: selected.fileMimeType, dialogTitle: "Open original report" });
          handedOff = true;
        } finally {
          // The receiving app may read the file after the share sheet closes.
          // Keep successful handoffs until sign-out; remove failed downloads now.
          if (!handedOff) await FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => null);
        }
        return;
      }
      await documentPreview.previewRemoteFile(
        `${API_URL}/files/${encodeURIComponent(selected.fileId)}`,
        token,
        selected.fileName || "medical-report.pdf"
      );
    } catch (error) {
      Alert.alert(
        "Report could not be opened",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader
        eyebrow="Clinical Vault"
        subtitle={`${memberReports.length} saved report${memberReports.length === 1 ? "" : "s"}`}
        title="Reports"
      />

      {/* iOS Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={19} color={colors.muted} />
          <TextInput
            accessibilityLabel="Search reports"
            onChangeText={setSearch}
            placeholder="Search report, biomarker, or lab"
            placeholderTextColor="#8F9E9B"
            style={styles.searchInput}
            value={search}
          />
          {search.length > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear report search" onPress={() => setSearch("")} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          contentContainerStyle={styles.categoriesContent}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Reports List */}
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((report) => (
          <Pressable
            key={report.id}
            accessibilityRole="button"
            accessibilityLabel={`Open report: ${report.title}`}
            onPress={() => setSelected(report)}
            style={({ pressed }) => [
              styles.rowItemWrap,
              pressed && { transform: [{ scale: 0.985 }] },
            ]}
          >
            <Card style={styles.reportRowCard}>
              <View style={styles.rowTop}>
                <View style={styles.labIcon}>
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2} style={styles.reportTitle}>
                    {report.title}
                  </Text>
                  <Text style={styles.reportMeta}>
                    {report.lab} · {report.date}
                  </Text>
                </View>
                <StatusPill status={report.status} />
              </View>

              {report.summary ? (
                <Text numberOfLines={2} style={styles.summary}>
                  {report.summary}
                </Text>
              ) : null}

              <View style={styles.rowBottom}>
                <View style={styles.markerBadge}>
                  <Ionicons name="pulse" size={13} color={colors.primary} />
                  <Text style={styles.markerText}>{report.parameters} biomarkers</Text>
                </View>

                {report.abnormal > 0 ? (
                  <View style={styles.attentionBadge}>
                    <Ionicons name="alert-circle" size={13} color={colors.critical} />
                    <Text style={styles.attentionText}>{report.abnormal} need attention</Text>
                  </View>
                ) : null}

                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
              </View>
            </Card>
          </Pressable>
        ))}

        {!filtered.length ? (
          <Card>
            <EmptyState
              description="No reports match your current search or category filter. Try clearing filters."
              icon="search-outline"
              title="No reports found"
            />
          </Card>
        ) : null}
      </ScrollView>

      {/* iOS PageSheet Modal for Detailed Clinical Report */}
      <Modal
        animationType="slide"
        onRequestClose={closeReport}
        presentationStyle="pageSheet"
        visible={Boolean(selected)}
      >
        {selected ? (
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.modal, { paddingTop: Platform.OS === "android" ? insets.top : 0 }]}>
            {/* Sheet Handle Indicator */}
            <View style={styles.sheetHandleContainer}>
              <View style={styles.sheetHandle} />
            </View>

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.modalEyebrowRow}>
                  <View style={styles.modalEyebrowDot} />
                  <Text style={styles.modalEyebrow}>CLINICAL REPORT DETAILS</Text>
                </View>
                <Text style={styles.modalTitle}>{selected.title}</Text>
                <Text style={styles.modalSubtitle}>
                  {selected.lab} · Report date {selected.date}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                  accessibilityLabel="Close report"
                onPress={closeReport}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={colors.ink} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.modalContent,
                { paddingBottom: insets.bottom + 36 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {selected.fileId ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open original report"
                  onPress={openOriginalReport}
                  style={styles.originalFileButton}
                >
                  <View style={styles.originalFileIcon}>
                    <Ionicons
                      color={colors.primary}
                      name={selected.fileMimeType === "application/pdf" ? "document-text" : "image"}
                      size={21}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.originalFileTitle}>Open original report</Text>
                    <Text numberOfLines={1} style={styles.originalFileName}>{selected.fileName}</Text>
                  </View>
                  <Ionicons color={colors.primary} name="open-outline" size={18} />
                </Pressable>
              ) : null}

              {!selected.fileId ? (
                <Card><Text style={styles.detailText}>The original document is not linked to this record. Select it below to restore the preview and extract measured values.</Text></Card>
              ) : null}
              {selected.fileId && selected.source !== "lab" ? <PrimaryButton
                title={analyzing ? analysisStep : "Extract parameters from saved report"}
                icon="sparkles-outline" loading={analyzing} disabled={analyzing}
                onPress={extractSavedParameters}
              /> : null}
              {selected.source !== "lab" ? <PrimaryButton
                title={analyzing ? analysisStep : selected.fileId ? "Select original & retry extraction" : "Attach original & extract values"}
                icon="document-attach-outline" loading={analyzing} disabled={analyzing}
                onPress={() => { void retryAnalysis().catch((error) => Alert.alert("File could not be selected", error instanceof Error ? error.message : "Please retry.")); }}
              /> : null}
              {selected.source !== "lab" ? <PrimaryButton title="Select report photo & extract" icon="images-outline" disabled={analyzing} onPress={() => { void retryAnalysis(true).catch((error) => Alert.alert("Photo could not be selected", error instanceof Error ? error.message : "Please retry.")); }} /> : null}
              {analysisError ? <Text accessibilityRole="alert" style={{ color: colors.critical }}>{analysisError}</Text> : null}
              {!selected.markers.length ? <Card><EmptyState title="No measured values extracted" description="Attach a readable original PDF or photo to extract the report values." icon="document-text-outline" /></Card> : null}
              {/* Executive Summary Card */}
              <Card style={styles.modalSectionCard}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="information-circle-outline" size={17} color={colors.primary} />
                  <Text style={styles.sectionLabel}>REPORT SUMMARY</Text>
                </View>
                <Text style={styles.detailText}>{selected.summary}</Text>
                <Text style={styles.detailText}>For information only. AI extraction and summaries can contain errors. Verify values against the original report and ask a qualified healthcare professional before making medical decisions.</Text>
              </Card>

              <Card style={styles.modalSectionCard}>
                <Text accessibilityRole="header" style={styles.sectionLabel}>SOURCES & LIMITATIONS</Text>
                <Text style={styles.detailText}>The issuing report is the primary source for your measurements and printed reference intervals. Reference intervals may differ between laboratories. General educational references are linked below; they do not verify your individual results.</Text>
                {medicalSourcesForReport(selected).map(source => (
                  <Pressable key={source.url} accessibilityRole="link" accessibilityLabel={source.title}
                    onPress={() => { void Linking.openURL(source.url).catch(() => Alert.alert("Source could not be opened", "Check your connection and try again.")); }}
                    style={{ paddingVertical: 12, minHeight: 44 }}>
                    <Text style={{ color: colors.primary, fontSize: 13, lineHeight: 20, fontWeight: "700", textDecorationLine: "underline" }}>{source.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}>{source.url}</Text>
                  </Pressable>
                ))}
                <Text style={styles.detailText}>A value inside its printed reference interval does not establish that you are healthy, and an out-of-range value is not a diagnosis.{medicalSourcesForReport(selected).length > 1 ? " BMI is a screening measure and does not directly measure body fat." : ""}</Text>
              </Card>

              {/* Biomarkers List */}
              <View style={styles.biomarkerSectionHeader}>
                <Text style={styles.sectionHeading}>Measured Biomarkers</Text>
                <Text style={styles.biomarkerCount}>
                  {selected.markers.length} parameters
                </Text>
              </View>

              {selected.markers.map((marker, index) => (
                <Card key={`${marker.name}-${index}`} style={styles.biomarkerCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.markerName}>{marker.name}</Text>
                    <Text style={styles.markerRange}>
                      Reference: {marker.range || "Not provided by the report"}
                    </Text>
                  </View>
                  <View style={styles.markerValueCol}>
                    <Text style={styles.markerValue}>{marker.value}</Text>
                    <StatusPill status={marker.status} />
                  </View>
                </Card>
              ))}

              {/* Secure Doctor Share Card */}
              <Card style={styles.shareCard}>
                <View style={styles.shareIconWrap}>
                  <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
                </View>
                <Text style={styles.shareTitle}>Secure Doctor Share</Text>
                <Text style={styles.shareCopy}>
                  Create a link that expires in 7 days. Anyone with the link can view this report, so share it only with your intended recipient.
                </Text>

                <TextInput
                  onChangeText={setRecipient}
                  placeholder="Doctor, clinic, or hospital name (optional)"
                  placeholderTextColor="#8C9C98"
                  style={styles.recipientInput}
                  value={recipient}
                />

                <PrimaryButton
                  disabled={sharing}
                  icon="share-social-outline"
                  loading={sharing}
                  onPress={shareReport}
                  title={sharing ? "Generating link..." : "Share report link"}
                />
                {shareUrl ? <Text selectable accessibilityLabel="Created report share link" style={{ color: colors.primary, marginTop: 12 }}>{shareUrl}</Text> : null}
                {shareError ? <Text accessibilityRole="alert" style={{ color: colors.critical, marginTop: 12 }}>{shareError}</Text> : null}
              </Card>
            </ScrollView>
          </KeyboardAvoidingView>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  attentionBadge: {
    alignItems: "center",
    backgroundColor: colors.criticalSoft,
    borderColor: "rgba(217, 72, 59, 0.15)",
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  attentionText: {
    color: colors.critical,
    fontSize: 10.5,
    fontWeight: "800",
  },
  biomarkerCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    padding: 14,
  },
  biomarkerCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  biomarkerSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  originalFileButton: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: "rgba(13,99,82,0.16)",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    padding: 13,
  },
  originalFileIcon: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  originalFileName: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  originalFileTitle: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "800",
  },
  categoriesContent: {
    gap: 8,
    paddingHorizontal: 18,
  },
  categoriesWrapper: {
    marginBottom: 8,
  },
  categoryChip: {
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...shadows.soft,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  categoryChipText: {
    color: colors.inkSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  clearSearchBtn: {
    padding: 4,
  },
  closeBtn: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  detailText: {
    color: colors.inkSecondary,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 8,
  },
  labIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  list: {
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  markerBadge: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  markerName: {
    color: colors.ink,
    fontSize: 13.5,
    fontWeight: "800",
  },
  markerRange: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  markerText: {
    color: colors.primary,
    fontSize: 10.5,
    fontWeight: "800",
  },
  markerValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
  },
  markerValueCol: {
    alignItems: "flex-end",
  },
  modal: {
    backgroundColor: colors.background,
    flex: 1,
  },
  modalContent: {
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  modalEyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  modalEyebrowDot: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 2.5,
    height: 5,
    width: 5,
  },
  modalEyebrowRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginBottom: 4,
  },
  modalHeader: {
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderBottomColor: colors.stroke,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingBottom: 16,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  modalSectionCard: {
    padding: 16,
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 4,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  recipientInput: {
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1.2,
    color: colors.ink,
    fontSize: 13.5,
    fontWeight: "700",
    height: 48,
    marginBottom: 12,
    marginTop: 14,
    paddingHorizontal: 14,
  },
  reportMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  reportRowCard: {
    padding: 16,
  },
  reportTitle: {
    color: colors.ink,
    fontSize: 14.5,
    fontWeight: "800",
  },
  rowBottom: {
    alignItems: "center",
    borderTopColor: colors.strokeMuted,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
  },
  rowItemWrap: {
    borderRadius: radius.card,
  },
  rowTop: {
    flexWrap: "wrap",
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1.2,
    flexDirection: "row",
    height: 48,
    paddingHorizontal: 14,
    ...shadows.soft,
  },
  searchContainer: {
    marginBottom: 12,
    paddingHorizontal: 18,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 13.5,
    fontWeight: "700",
    marginLeft: 8,
  },
  sectionHeading: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  sectionLabel: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  sectionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  shareCard: {
    backgroundColor: "#F2F9F7",
    borderColor: "rgba(13, 99, 82, 0.15)",
    borderWidth: 1.2,
    padding: 18,
  },
  shareCopy: {
    color: "#385E55",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 4,
  },
  shareIconWrap: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    marginBottom: 8,
    width: 42,
    ...shadows.soft,
  },
  shareTitle: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: "900",
  },
  sheetHandle: {
    backgroundColor: "#CBD5D1",
    borderRadius: 2.5,
    height: 5,
    width: 36,
  },
  sheetHandleContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    paddingTop: 10,
  },
  summary: {
    color: colors.inkSecondary,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 8,
  },
});
