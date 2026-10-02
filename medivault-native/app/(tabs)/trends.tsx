import { Ionicons } from "@expo/vector-icons";
import { Fragment, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, EmptyState, ScreenHeader, StatusPill } from "@/components";
import { colors, radius, shadows } from "@/theme";
import { useVault } from "@/vault-context";

function numeric(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function curvedPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let path = `M${points[0].x},${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const middleX = (current.x + next.x) / 2;
    const middleY = (current.y + next.y) / 2;
    path += ` Q${current.x},${current.y} ${middleX},${middleY}`;
    if (index === points.length - 2) path += ` T${next.x},${next.y}`;
  }
  return path;
}

export default function TrendsScreen() {
  const insets = useSafeAreaInsets();
  const { activeMember, reports } = useVault();
  const [filter, setFilter] = useState<"all" | "attention">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const memberReports = reports.filter(
    (report) => !activeMember || report.memberId === activeMember.id
  );

  const trends = useMemo(() => {
    const map = new Map<
      string,
      Array<{ date: string; status: string; value: number; valueLabel: string }>
    >();

    memberReports.forEach((report) =>
      report.markers.forEach((marker) => {
        const value = numeric(marker.value);
        if (value === null) return;
        const current = map.get(marker.name) ?? [];
        current.push({
          date: report.date,
          status: marker.status,
          value,
          valueLabel: marker.value,
        });
        map.set(marker.name, current);
      })
    );

    return [...map.entries()]
      .map(([name, points]) => ({
        name,
        points: points.sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
      }))
      .sort((a, b) => b.points.length - a.points.length);
  }, [memberReports]);

  const displayedTrends = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return trends.filter((trend) => {
      const latest = trend.points[trend.points.length - 1];
      const matchesFilter =
        filter === "all" ||
        trend.points.some(
          (point) => point.status !== "Normal" && point.status !== "Optimal"
        );
      const matchesSearch =
        !query ||
        trend.name.toLowerCase().includes(query) ||
        latest?.status.toLowerCase().includes(query) ||
        latest?.valueLabel.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [trends, filter, searchQuery]);

  const attentionCount = trends.filter((trend) => {
    const latest = trend.points[trend.points.length - 1];
    return latest && latest.status !== "Normal" && latest.status !== "Optimal";
  }).length;
  const stableCount = Math.max(0, trends.length - attentionCount);
  const healthScore = trends.length ? Math.round((stableCount / trends.length) * 100) : 0;
  const healthScoreDisplay = trends.length ? String(healthScore) : "00";

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
        eyebrow="Biomarker Trajectory"
        subtitle={`${trends.length} parameters analyzed over time`}
        title="Health Trends"
      />

      <View style={styles.orbitCard}>
        <View style={styles.orbitCopy}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE HEALTH SIGNAL</Text>
          </View>
          <Text style={styles.orbitTitle}>Clinical orbit</Text>
          <Text style={styles.orbitSubtitle}>
            Your latest biomarkers, balanced into one readable health trajectory.
          </Text>
          <View style={styles.orbitStats}>
            <View>
              <Text style={styles.orbitStatValue}>{stableCount}</Text>
              <Text style={styles.orbitStatLabel}>IN RANGE</Text>
            </View>
            <View style={styles.orbitDivider} />
            <View>
              <Text style={[styles.orbitStatValue, attentionCount > 0 && styles.orbitAlertValue]}>
                {attentionCount}
              </Text>
              <Text style={styles.orbitStatLabel}>TO REVIEW</Text>
            </View>
          </View>
        </View>

        <View style={styles.orbitVisual}>
          <Svg height={142} viewBox="0 0 142 142" width={142}>
            <Defs>
              <RadialGradient id="orb" cx="38%" cy="30%" r="68%">
                <Stop offset="0%" stopColor="#92F5D4" stopOpacity="1" />
                <Stop offset="46%" stopColor="#19C897" stopOpacity="0.96" />
                <Stop offset="100%" stopColor="#08715F" stopOpacity="1" />
              </RadialGradient>
              <LinearGradient id="orbit-ring" x1="0%" x2="100%" y1="0%" y2="100%">
                <Stop offset="0%" stopColor="#D9FFF1" stopOpacity="0.95" />
                <Stop offset="100%" stopColor="#5DE8BD" stopOpacity="0.12" />
              </LinearGradient>
            </Defs>
            <Ellipse cx="71" cy="122" fill="#001E19" opacity="0.5" rx="42" ry="9" />
            <Circle cx="71" cy="65" fill="#0A473C" opacity="0.55" r="54" />
            <Circle cx="71" cy="61" fill="url(#orb)" r="47" />
            <Circle cx="56" cy="45" fill="#FFFFFF" opacity="0.34" r="13" />
            <Ellipse
              cx="71"
              cy="61"
              fill="none"
              rx="59"
              ry="24"
              stroke="url(#orbit-ring)"
              strokeWidth="3"
              transform="rotate(-18 71 61)"
            />
            <Circle cx="122" cy="43" fill="#DFFFF4" r="4.5" />
          </Svg>
          <View style={styles.orbitScore}>
            <Text style={styles.orbitScoreValue}>{healthScoreDisplay}%</Text>
            <Text style={styles.orbitScoreLabel}>STABLE</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <View style={styles.searchIconWrap}>
            <Ionicons color={colors.primary} name="search" size={17} />
          </View>
          <TextInput
            accessibilityLabel="Search health charts"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never"
            onChangeText={setSearchQuery}
            placeholder="Search biomarker or chart"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            style={styles.searchInput}
            value={searchQuery}
          />
          {searchQuery ? (
            <Pressable
              accessibilityLabel="Clear chart search"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setSearchQuery("")}
              style={styles.searchClear}
            >
              <Ionicons color={colors.primaryDark} name="close" size={16} />
            </Pressable>
          ) : null}
        </View>
        {searchQuery.trim() ? (
          <Text style={styles.searchMeta}>
            {displayedTrends.length} matching chart{displayedTrends.length === 1 ? "" : "s"}
          </Text>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setFilter("all")}
          style={[styles.filterChip, filter === "all" && styles.filterChipActive]}
        >
          <Text
            style={[
              styles.filterChipText,
              filter === "all" && styles.filterChipTextActive,
            ]}
          >
            All Tracked ({trends.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter("attention")}
          style={[styles.filterChip, filter === "attention" && styles.filterChipActive]}
        >
          <Ionicons
            name="warning-outline"
            size={13}
            color={filter === "attention" ? "#fff" : colors.critical}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.filterChipText,
              filter === "attention" && styles.filterChipTextActive,
            ]}
          >
            Needs Attention
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {displayedTrends.map((trend) => {
          const values = trend.points.map((p) => p.value);
          const min = Math.min(...values);
          const max = Math.max(...values);
          const range = max - min || 1;

          const points = trend.points.map((point, index) => {
            const x =
              trend.points.length === 1
                ? 150
                : 20 + (index / (trend.points.length - 1)) * 260;
            const y = 88 - ((point.value - min) / range) * 56;
            return { ...point, x, y };
          });

          const linePath = curvedPath(points);

          // Area path for gradient fill
          const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},104 L${points[0].x.toFixed(1)},104 Z`;

          const latest = trend.points[trend.points.length - 1];
          const previous = trend.points[trend.points.length - 2];
          const delta = previous ? latest.value - previous.value : null;
          const isGood = latest.status === "Normal" || latest.status === "Optimal";
          const strokeColor = isGood ? colors.primary : colors.critical;
          const safeId = trend.name.replace(/[^a-zA-Z0-9]/g, "");
          const gradientId = `grad-${safeId}`;
          const surfaceId = `surface-${safeId}`;

          return (
            <View key={trend.name} style={styles.depthShell}>
              <View style={styles.depthLayerFar} />
              <View style={styles.depthLayerNear} />
              <Card style={styles.trendCard}>
              {/* Header */}
              <View style={styles.trendHeader}>
                <View style={styles.markerIdentity}>
                  <View style={[styles.markerGlyph, { backgroundColor: isGood ? "#DFFFF4" : "#FFF0EE" }]}>
                    <Ionicons
                      color={strokeColor}
                      name={isGood ? "pulse" : "alert-circle-outline"}
                      size={18}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                  <Text style={styles.trendName}>{trend.name}</Text>
                  <Text style={styles.trendValue}>{latest.valueLabel}</Text>
                  <Text style={styles.trendDate}>Last tested on {latest.date}</Text>
                  </View>
                </View>
                <StatusPill status={latest.status} />
              </View>

              {/* Perspective health signal chart */}
              <View style={styles.chartContainer}>
                <Svg
                  accessibilityLabel={`${trend.name} trend chart`}
                  height={116}
                  style={styles.svgChart}
                  viewBox="0 0 300 116"
                  width="100%"
                >
                  <Defs>
                    <LinearGradient id={surfaceId} x1="0%" x2="100%" y1="0%" y2="100%">
                      <Stop offset="0%" stopColor="#FBFDFC" />
                      <Stop offset="55%" stopColor="#F2F8F6" />
                      <Stop offset="100%" stopColor="#E8F3EF" />
                    </LinearGradient>
                    <LinearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
                      <Stop
                        offset="0%"
                        stopColor={strokeColor}
                        stopOpacity={0.2}
                      />
                      <Stop
                        offset="100%"
                        stopColor={strokeColor}
                        stopOpacity={0.04}
                      />
                    </LinearGradient>
                  </Defs>

                  <Rect fill={`url(#${surfaceId})`} height="112" rx="18" width="300" x="0" y="2" />
                  <Path d="M18,104 L282,104 L268,31 L32,31 Z" fill="#0D6352" opacity="0.018" />

                  {[38, 60, 82, 104].map((gridY, index) => (
                    <Line
                      key={`h-${gridY}`}
                      stroke="#4B8F80"
                      strokeDasharray={index === 3 ? undefined : "3, 5"}
                      strokeOpacity={index === 3 ? 0.24 : 0.13}
                      strokeWidth="1"
                      x1={22 + index * 2}
                      x2={278 - index * 2}
                      y1={gridY}
                      y2={gridY}
                    />
                  ))}
                  {[50, 100, 150, 200, 250].map((gridX) => (
                    <Line
                      key={`v-${gridX}`}
                      stroke="#4B8F80"
                      strokeOpacity="0.08"
                      strokeWidth="1"
                      x1={gridX}
                      x2={150 + (gridX - 150) * 0.88}
                      y1="104"
                      y2="31"
                    />
                  ))}

                  {/* Gradient Area Fill */}
                  <Path d={areaPath} fill={`url(#${gradientId})`} />

                  <Path
                    d={linePath}
                    fill="none"
                    opacity="0.12"
                    stroke={strokeColor}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="11"
                  />
                  <Path
                    d={linePath}
                    fill="none"
                    stroke={strokeColor}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3.6"
                  />

                  {/* Data Points */}
                  {points.map((p, idx) => {
                    const isLatest = idx === points.length - 1;
                    return (
                      <Fragment key={`${p.date}-${idx}`}>
                        {isLatest ? (
                          <Circle
                            cx={p.x}
                            cy={p.y}
                            fill={strokeColor}
                            opacity={0.26}
                            r="11"
                          />
                        ) : null}
                        <Circle
                          cx={p.x}
                          cy={p.y}
                          fill={isLatest ? "#FFFFFF" : "#F7FBFA"}
                          r={isLatest ? "5" : "3.5"}
                          stroke={strokeColor}
                          strokeWidth={isLatest ? "2.5" : "2"}
                        />
                      </Fragment>
                    );
                  })}
                </Svg>
                <View style={styles.chartCaption}>
                  <View style={[styles.signalDot, { backgroundColor: strokeColor }]} />
                  <Text style={styles.chartCaptionText}>BIOMARKER SIGNAL</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.trendFooter}>
                <View style={styles.pointsCountBadge}>
                  <Ionicons name="stats-chart" size={12} color={colors.muted} />
                  <Text style={styles.pointsCountText}>
                    {trend.points.length} verified reading{trend.points.length === 1 ? "" : "s"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.deltaBadge,
                    delta !== null && delta > 0 && isGood && styles.deltaBadgeNormal,
                    delta !== null && delta > 0 && !isGood && styles.deltaBadgeAlert,
                  ]}
                >
                  <Ionicons
                    name={
                      delta === null
                        ? "analytics"
                        : delta > 0
                        ? "arrow-up"
                        : delta < 0
                        ? "arrow-down"
                        : "remove"
                    }
                    size={11}
                    color={
                      delta === null
                        ? colors.muted
                        : delta > 0 && !isGood
                        ? colors.critical
                        : colors.primary
                    }
                  />
                  <Text
                    style={[
                      styles.deltaText,
                      delta !== null && delta > 0 && !isGood && { color: colors.critical },
                    ]}
                  >
                    {delta === null
                      ? "Baseline recorded"
                      : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} from prior test`}
                  </Text>
                </View>
              </View>
              </Card>
            </View>
          );
        })}

        {!displayedTrends.length ? (
          <Card>
            <EmptyState
              description={
                searchQuery.trim()
                  ? `No biomarker chart matches “${searchQuery.trim()}”. Try another name.`
                  : "Upload two or more reports with numerical biomarkers to generate interactive longitudinal trends."
              }
              icon={searchQuery.trim() ? "search-outline" : "analytics-outline"}
              title={searchQuery.trim() ? "No matching chart" : "No trend data available"}
            />
          </Card>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: "#F5FAF8",
    borderColor: "rgba(13,99,82,0.08)",
    borderRadius: 19,
    borderWidth: 1,
    marginTop: 14,
    position: "relative",
    shadowColor: "#0A4A3E",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  chartCaption: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    left: 15,
    position: "absolute",
    top: 13,
  },
  chartCaptionText: {
    color: "rgba(5,78,65,0.58)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  content: {
    gap: 14,
    paddingHorizontal: 18,
  },
  deltaBadge: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 9,
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  deltaBadgeAlert: {
    backgroundColor: colors.criticalSoft,
  },
  deltaBadgeNormal: {
    backgroundColor: colors.primarySoft,
  },
  deltaText: {
    color: colors.primary,
    fontSize: 10.5,
    fontWeight: "800",
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 9,
    ...shadows.soft,
  },
  filterChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  filterChipText: {
    color: colors.inkSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 18,
  },
  depthLayerFar: {
    backgroundColor: "#B7DED3",
    borderRadius: 24,
    bottom: -8,
    left: 12,
    opacity: 0.38,
    position: "absolute",
    right: 12,
    top: 8,
    transform: [{ scale: 0.97 }],
  },
  depthLayerNear: {
    backgroundColor: "#DCEDE8",
    borderRadius: 23,
    bottom: -4,
    left: 6,
    position: "absolute",
    right: 6,
    top: 4,
  },
  depthShell: {
    marginBottom: 8,
    position: "relative",
  },
  liveBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(151,255,222,0.1)",
    borderColor: "rgba(151,255,222,0.2)",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  liveDot: {
    backgroundColor: "#68F1C3",
    borderRadius: 4,
    height: 6,
    shadowColor: "#68F1C3",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    width: 6,
  },
  liveText: {
    color: "#A9F8DE",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  markerGlyph: {
    alignItems: "center",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    marginRight: 11,
    marginTop: 1,
    width: 40,
  },
  markerIdentity: {
    alignItems: "flex-start",
    flex: 1,
    flexDirection: "row",
    paddingRight: 8,
  },
  orbitAlertValue: {
    color: "#FFB8AD",
  },
  orbitCard: {
    backgroundColor: "#052F28",
    borderColor: "rgba(120,242,205,0.18)",
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 14,
    marginHorizontal: 18,
    minHeight: 190,
    overflow: "hidden",
    padding: 18,
    shadowColor: "#043B31",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 25,
  },
  orbitCopy: {
    flex: 1,
    zIndex: 2,
  },
  orbitDivider: {
    backgroundColor: "rgba(219,255,243,0.18)",
    height: 28,
    width: 1,
  },
  orbitScore: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 47,
  },
  orbitScoreLabel: {
    color: "#DFFFF4",
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 1,
  },
  orbitScoreValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -1,
  },
  orbitStatLabel: {
    color: "rgba(218,255,243,0.54)",
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  orbitStats: {
    alignItems: "center",
    flexDirection: "row",
    gap: 13,
    marginTop: 15,
  },
  orbitStatValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  orbitSubtitle: {
    color: "rgba(219,255,243,0.66)",
    fontSize: 10.5,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 5,
    maxWidth: 190,
  },
  orbitTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 11,
  },
  orbitVisual: {
    alignItems: "center",
    height: 142,
    justifyContent: "center",
    marginRight: -22,
    marginTop: 4,
    position: "relative",
    width: 142,
  },
  pointsCountBadge: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  pointsCountText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  screen: {
    backgroundColor: "#F0F6F3",
    flex: 1,
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(13,99,82,0.12)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 54,
    paddingHorizontal: 10,
    shadowColor: "#0A4A3E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  searchClear: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  searchIconWrap: {
    alignItems: "center",
    backgroundColor: "#DFFFF4",
    borderRadius: 14,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 13.5,
    fontWeight: "700",
    marginLeft: 10,
    paddingVertical: 0,
  },
  searchMeta: {
    color: colors.primary,
    fontSize: 10.5,
    fontWeight: "800",
    marginLeft: 5,
    marginTop: 7,
  },
  searchWrap: {
    marginBottom: 12,
    marginHorizontal: 18,
  },
  scrollContent: {
    flexGrow: 1,
  },
  svgChart: {
    overflow: "visible",
  },
  trendCard: {
    borderColor: "rgba(13,99,82,0.08)",
    borderRadius: 22,
    padding: 16,
    shadowColor: "#0A4A3E",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  trendDate: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  trendFooter: {
    alignItems: "center",
    borderTopColor: colors.strokeMuted,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 11,
    paddingTop: 11,
  },
  trendHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  trendName: {
    color: colors.ink,
    fontSize: 14.5,
    fontWeight: "800",
  },
  trendValue: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 4,
  },
  signalDot: {
    borderRadius: 4,
    height: 6,
    shadowColor: "#8CFFD9",
    shadowOpacity: 0.7,
    shadowRadius: 5,
    width: 6,
  },
});
