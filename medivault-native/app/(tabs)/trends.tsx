import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, EmptyState, ScreenHeader, StatusPill } from "@/components";
import { colors } from "@/theme";
import { useVault } from "@/vault-context";

function numeric(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export default function TrendsScreen() {
  const insets = useSafeAreaInsets();
  const { activeMember, reports } = useVault();
  const trends = useMemo(() => {
    const map = new Map<string, Array<{ date: string; status: string; value: number; valueLabel: string }>>();
    reports.filter((report) => !activeMember || report.memberId === activeMember.id).forEach((report) => report.markers.forEach((marker) => {
      const value = numeric(marker.value);
      if (value === null) return;
      const current = map.get(marker.name) ?? [];
      current.push({ date: report.date, status: marker.status, value, valueLabel: marker.value });
      map.set(marker.name, current);
    }));
    return [...map.entries()].map(([name, points]) => ({ name, points: points.sort((a, b) => Date.parse(a.date) - Date.parse(b.date)) }))
      .sort((a, b) => b.points.length - a.points.length);
  }, [activeMember, reports]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 30, paddingTop: insets.top + 8 }}>
      <ScreenHeader eyebrow="Longitudinal health" title="Trends" />
      <View style={styles.content}>
        {trends.map((trend) => {
          const values = trend.points.map((point) => point.value);
          const min = Math.min(...values);
          const max = Math.max(...values);
          const points = trend.points.map((point, index) => ({
            ...point,
            x: trend.points.length === 1 ? 150 : 18 + (index / (trend.points.length - 1)) * 264,
            y: 92 - ((point.value - min) / (max - min || 1)) * 62,
          }));
          const path = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
          const latest = trend.points[trend.points.length - 1];
          const previous = trend.points[trend.points.length - 2];
          const delta = previous ? latest.value - previous.value : null;
          return <Card key={trend.name}><View style={styles.trendHeader}><View><Text style={styles.name}>{trend.name}</Text><Text style={styles.reading}>{latest.valueLabel}</Text></View><StatusPill status={latest.status} /></View><Svg accessibilityLabel={`${trend.name} trend graph`} height={112} width="100%" viewBox="0 0 300 112"><Line x1="18" x2="282" y1="96" y2="96" stroke={colors.stroke} strokeWidth="1" /><Path d={path} fill="none" stroke={latest.status === "Normal" ? colors.primary : colors.critical} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />{points.map((point, index) => <Circle key={`${point.date}-${index}`} cx={point.x} cy={point.y} fill="#fff" r="4" stroke={colors.primary} strokeWidth="2" />)}</Svg><View style={styles.footer}><Text style={styles.meta}>{trend.points.length} reading{trend.points.length === 1 ? "" : "s"}</Text><Text style={[styles.delta, delta !== null && delta > 0 && { color: colors.critical }]}>{delta === null ? "New baseline" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} from previous`}</Text></View></Card>;
        })}
        {!trends.length ? <Card><EmptyState icon="analytics-outline" title="No trend data yet" description="Two or more numeric readings will create a progress graph." /></Card> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 11, paddingHorizontal: 16 },
  delta: { color: colors.primary, fontSize: 9, fontWeight: "900" },
  footer: { flexDirection: "row", justifyContent: "space-between" },
  meta: { color: colors.muted, fontSize: 9, fontWeight: "700" },
  name: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  reading: { color: colors.ink, fontSize: 22, fontWeight: "900", marginTop: 5 },
  screen: { backgroundColor: colors.background, flex: 1 },
  trendHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
});
