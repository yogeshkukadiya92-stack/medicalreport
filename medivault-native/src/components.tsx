import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/theme";

export function ScreenHeader({ eyebrow, title, action }: { action?: ReactNode; eyebrow: string; title: string }) {
  return <View style={styles.header}><View style={{ flex: 1 }}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View>{action}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StatusPill({ status }: { status: string }) {
  const alert = status === "High" || status === "Low" || status === "Needs review";
  const watch = status === "Watch";
  return <View style={[styles.pill, alert ? styles.pillAlert : watch ? styles.pillWatch : styles.pillGood]}><Text style={[styles.pillText, alert ? styles.alertText : watch ? styles.watchText : styles.goodText]}>{status}</Text></View>;
}

export function EmptyState({ icon, title, description }: {
  description: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
}) {
  return <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name={icon} size={22} color={colors.primary} /></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyText}>{description}</Text></View>;
}

export function LoadingBlock() {
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.emptyText}>Loading your private health vault...</Text></View>;
}

export function PrimaryButton({ title, onPress, disabled, icon }: {
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  title: string;
}) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, (pressed || disabled) && { opacity: 0.65 }]}>{icon ? <Ionicons name={icon} size={18} color="#fff" /> : null}<Text style={styles.buttonText}>{title}</Text></Pressable>;
}

const styles = StyleSheet.create({
  alertText: { color: colors.critical },
  button: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.control, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 48, paddingHorizontal: 18 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  card: { backgroundColor: colors.card, borderColor: colors.stroke, borderRadius: radius.card, borderWidth: 1, padding: 16 },
  empty: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 36 },
  emptyIcon: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: 8, height: 46, justifyContent: "center", width: 46 },
  emptyText: { color: colors.muted, fontSize: 12, fontWeight: "600", lineHeight: 18, marginTop: 7, textAlign: "center" },
  emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: "900", marginTop: 12 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  goodText: { color: colors.primary },
  header: { alignItems: "center", flexDirection: "row", gap: 12, paddingBottom: 16, paddingHorizontal: 18, paddingTop: 8 },
  loading: { alignItems: "center", gap: 10, justifyContent: "center", minHeight: 240 },
  pill: { borderRadius: 5, paddingHorizontal: 8, paddingVertical: 5 },
  pillAlert: { backgroundColor: colors.criticalSoft },
  pillGood: { backgroundColor: colors.primarySoft },
  pillText: { fontSize: 9, fontWeight: "900" },
  pillWatch: { backgroundColor: colors.warningSoft },
  title: { color: colors.ink, fontSize: 25, fontWeight: "900", letterSpacing: 0, marginTop: 3 },
  watchText: { color: colors.warning },
});
