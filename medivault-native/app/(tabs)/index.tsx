import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/auth-context";
import { Card, EmptyState, LoadingBlock, ScreenHeader, StatusPill } from "@/components";
import { colors, radius, shadows } from "@/theme";
import { useVault } from "@/vault-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeMember, isLoading, isOffline, refresh, reports } = useVault();

  const memberReports = activeMember
    ? reports.filter((report) => report.memberId === activeMember.id)
    : [];
  const abnormal = memberReports.reduce(
    (count, report) => count + report.abnormal,
    0
  );
  const score = memberReports.length
    ? Math.max(25, Math.min(95, 90 - abnormal * 5))
    : 78;

  // SVG Circular progress math
  const ringRadius = 34;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingBottom: 36,
          paddingTop: insets.top + 8,
        },
      ]}
      refreshControl={
        <RefreshControl
          onRefresh={refresh}
          refreshing={isLoading}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      {/* Screen Header */}
      <ScreenHeader
        action={
          <Pressable
            accessibilityLabel="Privacy & Security"
            onPress={() => router.push("/privacy")}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
          >
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          </Pressable>
        }
        eyebrow="Clinical Health Timeline"
        subtitle={
          activeMember
            ? `${activeMember.relation} · ${activeMember.age || "32"} yrs · ${activeMember.bloodGroup || "O+"}`
            : "Personal Vault"
        }
        title={activeMember?.name || user?.name || "Priyank Patel"}
      />

      {isOffline ? (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={14} color={colors.warning} />
          <Text style={styles.offlineText}>Offline mode · Viewing cached health vault</Text>
        </View>
      ) : null}

      {isLoading && !reports.length ? (
        <LoadingBlock />
      ) : !activeMember ? (
        <Card style={styles.margin}>
          <EmptyState
            description="Create a family profile to connect clinical reports by mobile number."
            icon="person-add-outline"
            title="Add your first profile"
          />
        </Card>
      ) : (
        <View style={styles.content}>
          {/* Hero Health Score Card */}
          <View style={styles.scoreHero}>
            <View style={styles.scoreLeft}>
              <View style={styles.scoreBadge}>
                <View style={styles.scoreBadgeDot} />
                <Text style={styles.scoreBadgeText}>CLINICAL INDEX</Text>
              </View>
              <Text style={styles.scoreNumber}>{score}</Text>
              <Text style={styles.scoreStatus}>
                {score >= 85 ? "Optimal Health" : score >= 70 ? "Good Condition" : "Needs Review"}
              </Text>
              <Text style={styles.scoreSubtitle}>
                Based on {memberReports.length} verified lab report{memberReports.length === 1 ? "" : "s"}
              </Text>
            </View>

            {/* Circular SVG Ring */}
            <View style={styles.scoreRight}>
              <Svg height={84} width={84}>
                {/* Background track */}
                <Circle
                  cx="42"
                  cy="42"
                  fill="none"
                  r={ringRadius}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth={strokeWidth}
                />
                {/* Progress bar */}
                <Circle
                  cx="42"
                  cy="42"
                  fill="none"
                  origin="42, 42"
                  r={ringRadius}
                  rotation="-90"
                  stroke={colors.primaryAccent}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  strokeWidth={strokeWidth}
                />
              </Svg>
              <View style={styles.ringCenterTextWrap}>
                <Text style={styles.ringCenterText}>{score}%</Text>
              </View>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>REPORTS</Text>
                <Ionicons name="documents-outline" size={14} color={colors.primary} />
              </View>
              <Text style={styles.metricValue}>{memberReports.length}</Text>
              <Text style={styles.metricSub}>Connected</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>ATTENTION</Text>
                <Ionicons
                  name={abnormal > 0 ? "warning-outline" : "checkmark-circle-outline"}
                  size={14}
                  color={abnormal > 0 ? colors.critical : colors.good}
                />
              </View>
              <Text
                style={[
                  styles.metricValue,
                  abnormal > 0 && { color: colors.critical },
                ]}
              >
                {abnormal}
              </Text>
              <Text style={styles.metricSub}>Parameters</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>LABS</Text>
                <Ionicons name="medkit-outline" size={14} color={colors.primary} />
              </View>
              <Text style={styles.metricValue}>
                {new Set(memberReports.map((item) => item.lab)).size}
              </Text>
              <Text style={styles.metricSub}>Synced</Text>
            </View>
          </View>

          {/* Quick Action: Scan Report Banner */}
          <Pressable
            onPress={() => router.push("/(tabs)/upload")}
            style={({ pressed }) => [
              styles.quickActionBanner,
              pressed && { transform: [{ scale: 0.985 }] },
            ]}
          >
            <View style={styles.quickIconCircle}>
              <Ionicons name="scan-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickBannerTitle}>Scan new medical report</Text>
              <Text style={styles.quickBannerSub}>
                Upload PDF or photo · AI extracts biomarkers instantly
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>

          {/* Section: Latest Verified Reports */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Latest Reports</Text>
            <Pressable onPress={() => router.push("/(tabs)/reports")}>
              <Text style={styles.viewAllLink}>View all ({memberReports.length})</Text>
            </Pressable>
          </View>

          {memberReports.slice(0, 4).map((report) => (
            <Pressable
              key={report.id}
              onPress={() =>
                router.push({
                  params: { reportId: report.id },
                  pathname: "/(tabs)/reports",
                })
              }
              style={({ pressed }) => [
                styles.reportItemWrap,
                pressed && { transform: [{ scale: 0.985 }] },
              ]}
            >
              <Card style={styles.reportCard}>
                <View style={styles.reportTopRow}>
                  <View style={styles.labIconBadge}>
                    <Ionicons name="flask-outline" size={18} color={colors.primary} />
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
                  <Text numberOfLines={2} style={styles.reportSummary}>
                    {report.summary}
                  </Text>
                ) : null}

                <View style={styles.reportFooter}>
                  <View style={styles.paramCounter}>
                    <Ionicons name="pulse-outline" size={13} color={colors.muted} />
                    <Text style={styles.paramText}>{report.parameters} biomarkers</Text>
                  </View>
                  {report.abnormal > 0 ? (
                    <View style={styles.paramCounter}>
                      <Ionicons name="alert-circle" size={13} color={colors.critical} />
                      <Text style={[styles.paramText, { color: colors.critical }]}>
                        {report.abnormal} need attention
                      </Text>
                    </View>
                  ) : null}
                  <View style={{ flex: 1 }} />
                  <Ionicons name="chevron-forward" size={15} color={colors.subtle} />
                </View>
              </Card>
            </Pressable>
          ))}

          {!memberReports.length ? (
            <Card>
              <EmptyState
                description="Upload a lab PDF or photo to automatically populate your health vault."
                icon="documents-outline"
                title="No reports connected yet"
              />
            </Card>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingHorizontal: 18,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
    ...shadows.soft,
  },
  labIconBadge: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  margin: {
    marginHorizontal: 18,
  },
  metricCard: {
    backgroundColor: colors.card,
    borderColor: colors.stroke,
    borderRadius: radius.card - 2,
    borderWidth: 1,
    flex: 1,
    padding: 14,
    ...shadows.soft,
  },
  metricHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  metricSub: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  metricValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 6,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  offlineBanner: {
    alignItems: "center",
    backgroundColor: colors.warningSoft,
    borderColor: "rgba(180, 83, 9, 0.15)",
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 18,
    marginTop: -6,
    padding: 10,
  },
  offlineText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: "700",
  },
  paramCounter: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  paramText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  quickActionBanner: {
    alignItems: "center",
    backgroundColor: "#E8F7F3",
    borderColor: "rgba(13, 99, 82, 0.18)",
    borderRadius: radius.card,
    borderWidth: 1.2,
    flexDirection: "row",
    gap: 14,
    padding: 16,
    ...shadows.soft,
  },
  quickBannerSub: {
    color: "#305A51",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  quickBannerTitle: {
    color: colors.primaryDark,
    fontSize: 14.5,
    fontWeight: "900",
  },
  quickIconCircle: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    height: 44,
    justifyContent: "center",
    width: 44,
    ...shadows.soft,
  },
  reportCard: {
    padding: 16,
  },
  reportFooter: {
    alignItems: "center",
    borderTopColor: colors.strokeMuted,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
  },
  reportItemWrap: {
    borderRadius: radius.card,
  },
  reportMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  reportSummary: {
    color: colors.inkSecondary,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 8,
  },
  reportTitle: {
    color: colors.ink,
    fontSize: 14.5,
    fontWeight: "800",
  },
  reportTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  ringCenterText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  ringCenterTextWrap: {
    alignItems: "center",
    height: 84,
    justifyContent: "center",
    position: "absolute",
    width: 84,
  },
  scoreBadge: {
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.18)",
    borderRadius: 6,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scoreBadgeDot: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  scoreBadgeText: {
    color: "#9DF0DD",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  scoreHero: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 22,
    ...shadows.elevated,
  },
  scoreLeft: {
    alignItems: "flex-start",
    flex: 1,
  },
  scoreNumber: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 6,
  },
  scoreRight: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  scoreStatus: {
    color: "#83EBD6",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 1,
  },
  scoreSubtitle: {
    color: "#B1D4CC",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sectionHeading: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  viewAllLink: {
    color: colors.primary,
    fontSize: 12.5,
    fontWeight: "800",
  },
});
