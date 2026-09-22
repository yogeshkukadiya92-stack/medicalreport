import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
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

export default function TrendsScreen() {
  const insets = useSafeAreaInsets();
  const { activeMember, reports } = useVault();
  const [filter, setFilter] = useState<"all" | "attention">("all");

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
    if (filter === "attention") {
      return trends.filter((t) =>
        t.points.some((p) => p.status !== "Normal" && p.status !== "Optimal")
      );
    }
    return trends;
  }, [trends, filter]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingBottom: insets.bottom + 36,
          paddingTop: insets.top + 8,
        },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <ScreenHeader
        eyebrow="Biomarker Trajectory"
        subtitle={`${trends.length} parameters analyzed over time`}
        title="Health Trends"
      />

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

          // Line path
          const linePath = points
            .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(" ");

          // Area path for gradient fill
          const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},100 L${points[0].x.toFixed(1)},100 Z`;

          const latest = trend.points[trend.points.length - 1];
          const previous = trend.points[trend.points.length - 2];
          const delta = previous ? latest.value - previous.value : null;
          const isGood = latest.status === "Normal" || latest.status === "Optimal";
          const strokeColor = isGood ? colors.primary : colors.critical;
          const gradientId = `grad-${trend.name.replace(/[^a-zA-Z0-9]/g, "")}`;

          return (
            <Card key={trend.name} style={styles.trendCard}>
              {/* Header */}
              <View style={styles.trendHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trendName}>{trend.name}</Text>
                  <Text style={styles.trendValue}>{latest.valueLabel}</Text>
                  <Text style={styles.trendDate}>Last tested on {latest.date}</Text>
                </View>
                <StatusPill status={latest.status} />
              </View>

              {/* Apple Health Style SVG Area Chart */}
              <View style={styles.chartContainer}>
                <Svg
                  accessibilityLabel={`${trend.name} trend chart`}
                  height={116}
                  style={styles.svgChart}
                  viewBox="0 0 300 116"
                  width="100%"
                >
                  <Defs>
                    <LinearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
                      <Stop
                        offset="0%"
                        stopColor={strokeColor}
                        stopOpacity={0.25}
                      />
                      <Stop
                        offset="100%"
                        stopColor={strokeColor}
                        stopOpacity={0.01}
                      />
                    </LinearGradient>
                  </Defs>

                  {/* Baseline reference lines */}
                  <Line
                    stroke={colors.strokeMuted}
                    strokeDasharray="4, 4"
                    strokeWidth="1"
                    x1="16"
                    x2="284"
                    y1="32"
                    y2="32"
                  />
                  <Line
                    stroke={colors.strokeMuted}
                    strokeWidth="1"
                    x1="16"
                    x2="284"
                    y1="100"
                    y2="100"
                  />

                  {/* Gradient Area Fill */}
                  <Path d={areaPath} fill={`url(#${gradientId})`} />

                  {/* Trend Line */}
                  <Path
                    d={linePath}
                    fill="none"
                    stroke={strokeColor}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3.2"
                  />

                  {/* Data Points */}
                  {points.map((p, idx) => {
                    const isLatest = idx === points.length - 1;
                    return (
                      <View key={`${p.date}-${idx}`}>
                        {isLatest ? (
                          <Circle
                            cx={p.x}
                            cy={p.y}
                            fill={strokeColor}
                            opacity={0.2}
                            r="9"
                          />
                        ) : null}
                        <Circle
                          cx={p.x}
                          cy={p.y}
                          fill="#fff"
                          r={isLatest ? "5" : "3.5"}
                          stroke={strokeColor}
                          strokeWidth={isLatest ? "2.5" : "2"}
                        />
                      </View>
                    );
                  })}
                </Svg>
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
          );
        })}

        {!displayedTrends.length ? (
          <Card>
            <EmptyState
              description="Upload two or more reports with numerical biomarkers to generate interactive longitudinal trends."
              icon="analytics-outline"
              title="No trend data available"
            />
          </Card>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    marginVertical: 4,
  },
  content: {
    gap: 14,
    paddingHorizontal: 18,
  },
  deltaBadge: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
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
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 7,
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
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  svgChart: {
    overflow: "visible",
  },
  trendCard: {
    padding: 16,
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
    marginTop: 8,
    paddingTop: 10,
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
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 4,
  },
});
