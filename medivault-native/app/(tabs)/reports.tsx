import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "@/api";
import { useAuth } from "@/auth-context";
import { Card, EmptyState, ScreenHeader, StatusPill } from "@/components";
import { colors } from "@/theme";
import type { AppReport } from "@/types";
import { useVault } from "@/vault-context";

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ reportId?: string }>();
  const { token } = useAuth();
  const { activeMember, reports } = useVault();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AppReport | null>(null);
  const [recipient, setRecipient] = useState("");
  const [sharing, setSharing] = useState(false);
  const memberReports = reports.filter((report) => !activeMember || report.memberId === activeMember.id);
  const filtered = useMemo(() => memberReports.filter((report) => `${report.title} ${report.lab} ${report.category}`.toLowerCase().includes(search.toLowerCase())), [memberReports, search]);
  useEffect(() => {
    if (params.reportId) setSelected(reports.find((item) => item.id === params.reportId) ?? null);
  }, [params.reportId, reports]);

  async function shareReport() {
    if (!selected || !token) return;
    setSharing(true);
    try {
      const result = await apiRequest<{ url: string }>("/shares", {
        body: JSON.stringify({ expiresInHours: 24 * 7, recipientLabel: recipient, reportId: selected.id }),
        method: "POST",
      }, token);
      await Share.share({ message: `MediVault secure report link (expires in 7 days): ${result.url}` });
    } finally {
      setSharing(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader eyebrow="Medical timeline" title="Reports" />
      <View style={styles.search}><Ionicons name="search-outline" size={18} color={colors.muted} /><TextInput onChangeText={setSearch} placeholder="Search report, test or lab" placeholderTextColor="#8C9C98" style={styles.searchInput} value={search} /></View>
      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((report) => <Pressable key={report.id} onPress={() => setSelected(report)}><Card style={styles.row}><View style={styles.rowTop}><View style={styles.reportIcon}><Ionicons name="document-text-outline" size={19} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.reportTitle}>{report.title}</Text><Text style={styles.meta}>{report.lab} · {report.date}</Text></View><StatusPill status={report.status} /></View><Text numberOfLines={2} style={styles.summary}>{report.summary}</Text><View style={styles.rowBottom}><Text style={styles.marker}>{report.parameters} values</Text><Text style={[styles.marker, report.abnormal > 0 && { color: colors.critical }]}>{report.abnormal} attention</Text><Ionicons name="chevron-forward" size={16} color={colors.muted} /></View></Card></Pressable>)}
        {!filtered.length ? <Card><EmptyState icon="search-outline" title="No reports found" description="Try another search or upload a new report." /></Card> : null}
      </ScrollView>
      <Modal animationType="slide" onRequestClose={() => setSelected(null)} presentationStyle="pageSheet" visible={Boolean(selected)}>
        {selected ? <ScrollView style={styles.modal} contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top + 10 }}><View style={styles.modalHeader}><View style={{ flex: 1 }}><Text style={styles.eyebrow}>REPORT DETAILS</Text><Text style={styles.modalTitle}>{selected.title}</Text><Text style={styles.meta}>{selected.lab} · {selected.date}</Text></View><Pressable onPress={() => setSelected(null)} style={styles.close}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View><View style={styles.modalContent}><Card><Text style={styles.sectionLabel}>SUMMARY</Text><Text style={styles.detailText}>{selected.summary}</Text></Card><Text style={styles.sectionHeading}>Clinical values</Text>{selected.markers.map((marker, index) => <Card key={`${marker.name}-${index}`} style={styles.valueRow}><View style={{ flex: 1 }}><Text style={styles.valueName}>{marker.name}</Text><Text style={styles.range}>Reference {marker.range}</Text></View><View style={{ alignItems: "flex-end" }}><Text style={styles.value}>{marker.value}</Text><StatusPill status={marker.status} /></View></Card>)}<Card><Text style={styles.sectionLabel}>SECURE DOCTOR SHARE</Text><Text style={styles.shareCopy}>Create a revocable link. Original account access is never shared.</Text><TextInput onChangeText={setRecipient} placeholder="Doctor or clinic name (optional)" placeholderTextColor="#8C9C98" style={styles.recipient} value={recipient} /><Pressable disabled={sharing} onPress={shareReport} style={styles.shareButton}><Ionicons name="share-social-outline" size={18} color="#fff" /><Text style={styles.shareButtonText}>{sharing ? "Creating link..." : "Share for 7 days"}</Text></Pressable></Card></View></ScrollView> : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  close: { alignItems: "center", backgroundColor: colors.background, borderRadius: 7, height: 40, justifyContent: "center", width: 40 },
  detailText: { color: colors.ink, fontSize: 12, fontWeight: "600", lineHeight: 19, marginTop: 8 },
  eyebrow: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  list: { gap: 10, padding: 16, paddingBottom: 30 },
  marker: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 10, fontWeight: "600", marginTop: 4 },
  modal: { backgroundColor: colors.background, flex: 1 },
  modalContent: { gap: 10, padding: 16 },
  modalHeader: { alignItems: "flex-start", backgroundColor: "#fff", borderBottomColor: colors.stroke, borderBottomWidth: 1, flexDirection: "row", gap: 12, padding: 18 },
  modalTitle: { color: colors.ink, fontSize: 22, fontWeight: "900", marginTop: 4 },
  range: { color: colors.muted, fontSize: 9, fontWeight: "600", marginTop: 4 },
  recipient: { borderColor: colors.stroke, borderRadius: 7, borderWidth: 1, color: colors.ink, fontSize: 12, fontWeight: "700", height: 46, marginTop: 13, paddingHorizontal: 12 },
  reportIcon: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: 7, height: 40, justifyContent: "center", width: 40 },
  reportTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  row: { gap: 12 },
  rowBottom: { alignItems: "center", borderTopColor: "#EDF2F1", borderTopWidth: 1, flexDirection: "row", gap: 14, paddingTop: 10 },
  rowTop: { alignItems: "center", flexDirection: "row", gap: 11 },
  screen: { backgroundColor: colors.background, flex: 1 },
  search: { alignItems: "center", backgroundColor: "#fff", borderColor: colors.stroke, borderRadius: 7, borderWidth: 1, flexDirection: "row", marginHorizontal: 16, paddingHorizontal: 12 },
  searchInput: { color: colors.ink, flex: 1, fontSize: 12, fontWeight: "700", height: 46, marginLeft: 8 },
  sectionHeading: { color: colors.ink, fontSize: 14, fontWeight: "900", marginTop: 8 },
  sectionLabel: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  shareButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: 7, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 10, minHeight: 46 },
  shareButtonText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  shareCopy: { color: colors.muted, fontSize: 10, fontWeight: "600", lineHeight: 16, marginTop: 6 },
  summary: { color: colors.muted, fontSize: 10, fontWeight: "600", lineHeight: 16 },
  value: { color: colors.ink, fontSize: 15, fontWeight: "900", marginBottom: 5 },
  valueName: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  valueRow: { alignItems: "center", flexDirection: "row", gap: 12, padding: 13 },
});
