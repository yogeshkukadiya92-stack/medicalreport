import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "@/api";
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

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ reportId?: string }>();
  const { token } = useAuth();
  const { activeMember, reports } = useVault();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selected, setSelected] = useState<AppReport | null>(null);
  const [recipient, setRecipient] = useState("");
  const [sharing, setSharing] = useState(false);

  const memberReports = reports.filter(
    (report) => !activeMember || report.memberId === activeMember.id
  );

  const filtered = useMemo(() => {
    return memberReports.filter((report) => {
      const matchesSearch = `${report.title} ${report.lab} ${report.category}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCat =
        selectedCategory === "All" ||
        report.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        report.title.toLowerCase().includes(selectedCategory.toLowerCase());
      return matchesSearch && matchesCat;
    });
  }, [memberReports, search, selectedCategory]);

  useEffect(() => {
    if (params.reportId) {
      setSelected(reports.find((item) => item.id === params.reportId) ?? null);
    }
  }, [params.reportId, reports]);

  async function shareReport() {
    if (!selected || !token) return;
    setSharing(true);
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
      await Share.share({
        message: `MediVault secure clinical report link (expires in 7 days): ${result.url}`,
      });
    } finally {
      setSharing(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader
        eyebrow="Clinical Vault"
        subtitle={`${memberReports.length} verified laboratory document${memberReports.length === 1 ? "" : "s"}`}
        title="Reports"
      />

      {/* iOS Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={19} color={colors.muted} />
          <TextInput
            onChangeText={setSearch}
            placeholder="Search report, biomarker, or lab"
            placeholderTextColor="#8F9E9B"
            style={styles.searchInput}
            value={search}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")} style={styles.clearSearchBtn}>
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
                  <Text numberOfLines={1} style={styles.reportTitle}>
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
        onRequestClose={() => setSelected(null)}
        presentationStyle="pageSheet"
        visible={Boolean(selected)}
      >
        {selected ? (
          <View style={styles.modal}>
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
                  {selected.lab} · Verified on {selected.date}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close"
                onPress={() => setSelected(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={colors.ink} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.modalContent,
                { paddingBottom: insets.bottom + 36 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Executive Summary Card */}
              <Card style={styles.modalSectionCard}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="information-circle-outline" size={17} color={colors.primary} />
                  <Text style={styles.sectionLabel}>CLINICAL SUMMARY</Text>
                </View>
                <Text style={styles.detailText}>{selected.summary}</Text>
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
                      Reference: {marker.range || "Standard"}
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
                  Generate an end-to-end encrypted 7-day link. The doctor views only this verified report without account login.
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
              </Card>
            </ScrollView>
          </View>
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
