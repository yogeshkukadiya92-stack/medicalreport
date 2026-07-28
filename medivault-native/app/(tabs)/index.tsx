import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/auth-context";
import { Card, EmptyState, LoadingBlock, ScreenHeader, StatusPill } from "@/components";
import { colors } from "@/theme";
import { useVault } from "@/vault-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeMember, isLoading, isOffline, refresh, reports } = useVault();
  const memberReports = activeMember ? reports.filter((report) => report.memberId === activeMember.id) : [];
  const abnormal = memberReports.reduce((count, report) => count + report.abnormal, 0);
  const score = memberReports.length ? Math.max(25, Math.min(95, 90 - abnormal * 5)) : 0;

  return (
    <ScrollView refreshControl={<RefreshControl onRefresh={refresh} refreshing={isLoading} tintColor={colors.primary} />} style={styles.screen} contentContainerStyle={{ paddingBottom: 28, paddingTop: insets.top + 8 }}>
      <ScreenHeader eyebrow="Unified health timeline" title={activeMember?.name || user?.name || "MediVault"} action={<Pressable onPress={() => router.push("/privacy")} style={styles.iconButton}><Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} /></Pressable>} />
      {isOffline ? <Text style={styles.offline}>Offline view · showing last synced data</Text> : null}
      {isLoading && !reports.length ? <LoadingBlock /> : !activeMember ? <Card style={styles.margin}><EmptyState icon="person-add-outline" title="Add your first profile" description="Create a family profile to connect reports by mobile number." /></Card> : (
        <View style={styles.content}>
          <Card style={styles.scoreCard}>
            <View style={styles.scoreTop}><View><Text style={styles.scoreLabel}>HEALTH SCORE</Text><Text style={styles.scoreValue}>{score || "--"}</Text><Text style={styles.scoreMeta}>{memberReports.length} connected report{memberReports.length === 1 ? "" : "s"}</Text></View><View style={styles.scoreRing}><Text style={styles.scoreRingText}>{score ? `${score}%` : "--"}</Text></View></View>
          </Card>
          <View style={styles.metrics}>
            <Card style={styles.metric}><Text style={styles.metricLabel}>REPORTS</Text><Text style={styles.metricValue}>{memberReports.length}</Text></Card>
            <Card style={styles.metric}><Text style={styles.metricLabel}>ATTENTION</Text><Text style={[styles.metricValue, abnormal > 0 && { color: colors.critical }]}>{abnormal}</Text></Card>
            <Card style={styles.metric}><Text style={styles.metricLabel}>LABS</Text><Text style={styles.metricValue}>{new Set(memberReports.map((item) => item.lab)).size}</Text></Card>
          </View>
          <View style={styles.sectionTitle}><Text style={styles.sectionHeading}>Latest reports</Text><Pressable onPress={() => router.push("/(tabs)/reports")}><Text style={styles.link}>View all</Text></Pressable></View>
          {memberReports.slice(0, 4).map((report) => <Pressable key={report.id} onPress={() => router.push({ pathname: "/(tabs)/reports", params: { reportId: report.id } })}><Card style={styles.report}><View style={styles.reportIcon}><Ionicons name="document-text-outline" size={19} color={colors.primary} /></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.reportTitle}>{report.title}</Text><Text style={styles.reportMeta}>{report.lab} · {report.date}</Text></View><StatusPill status={report.status} /></Card></Pressable>)}
          {!memberReports.length ? <Card><EmptyState icon="documents-outline" title="No reports yet" description="Upload a report or wait for your clinic to publish one." /></Card> : null}
          <Pressable onPress={() => router.push("/(tabs)/upload")} style={styles.quickAction}><View style={styles.quickIcon}><Ionicons name="camera-outline" size={20} color={colors.primaryDark} /></View><View style={{ flex: 1 }}><Text style={styles.quickTitle}>Scan a medical report</Text><Text style={styles.quickMeta}>Photo or PDF · values extracted automatically</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingHorizontal: 16 },
  iconButton: { alignItems: "center", backgroundColor: colors.card, borderColor: colors.stroke, borderRadius: 7, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  link: { color: colors.primary, fontSize: 11, fontWeight: "900" },
  margin: { marginHorizontal: 16 },
  metric: { flex: 1, padding: 13 },
  metricLabel: { color: colors.muted, fontSize: 8, fontWeight: "900" },
  metricValue: { color: colors.ink, fontSize: 23, fontWeight: "900", marginTop: 5 },
  metrics: { flexDirection: "row", gap: 8 },
  offline: { backgroundColor: colors.warningSoft, color: colors.warning, fontSize: 10, fontWeight: "800", marginBottom: 12, marginHorizontal: 16, padding: 9, textAlign: "center" },
  quickAction: { alignItems: "center", backgroundColor: "#C8F4E8", borderRadius: 8, flexDirection: "row", gap: 12, marginTop: 4, padding: 14 },
  quickIcon: { alignItems: "center", backgroundColor: "#fff", borderRadius: 7, height: 40, justifyContent: "center", width: 40 },
  quickMeta: { color: "#487168", fontSize: 10, fontWeight: "600", marginTop: 3 },
  quickTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: "900" },
  report: { alignItems: "center", flexDirection: "row", gap: 11, padding: 13 },
  reportIcon: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: 7, height: 38, justifyContent: "center", width: 38 },
  reportMeta: { color: colors.muted, fontSize: 9, fontWeight: "600", marginTop: 3 },
  reportTitle: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  scoreCard: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark, padding: 18 },
  scoreLabel: { color: "#91E7D5", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  scoreMeta: { color: "#B9D8D1", fontSize: 10, fontWeight: "600", marginTop: 4 },
  scoreRing: { alignItems: "center", borderColor: "#57D8B9", borderRadius: 40, borderWidth: 7, height: 72, justifyContent: "center", width: 72 },
  scoreRingText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  scoreTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  scoreValue: { color: "#fff", fontSize: 38, fontWeight: "900", marginTop: 3 },
  screen: { backgroundColor: colors.background, flex: 1 },
  sectionHeading: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  sectionTitle: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
});
