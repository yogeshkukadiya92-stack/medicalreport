import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows } from "@/theme";

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  action?: ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {eyebrow ? (
          <View style={styles.eyebrowContainer}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.actionWrapper}>{action}</View> : null}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: object | (object | false | undefined)[];
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StatusPill({ status }: { status: string }) {
  const isAlert =
    status === "High" ||
    status === "Low" ||
    status === "Needs review" ||
    status === "Critical";
  const isWatch = status === "Watch" || status === "Borderline";

  return (
    <View
      style={[
        styles.pill,
        isAlert ? styles.pillAlert : isWatch ? styles.pillWatch : styles.pillGood,
      ]}
    >
      <View
        style={[
          styles.pillDot,
          isAlert ? styles.dotAlert : isWatch ? styles.dotWatch : styles.dotGood,
        ]}
      />
      <Text
        style={[
          styles.pillText,
          isAlert ? styles.alertText : isWatch ? styles.watchText : styles.goodText,
        ]}
      >
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  action?: ReactNode;
  description: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <View style={styles.emptyIconHalo} />
        <View style={styles.emptyIcon}>
          <Ionicons name={icon} size={26} color={colors.primary} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{description}</Text>
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  );
}

export function LoadingBlock({ message }: { message?: string }) {
  return (
    <View style={styles.loading}>
      <View style={styles.loadingSpinnerWrap}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
      <Text style={styles.loadingText}>
        {message || "Securing and syncing health vault..."}
      </Text>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  icon,
  loading,
}: {
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>["name"];
  loading?: boolean;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (pressed || disabled) && styles.buttonPressed,
        pressed && styles.buttonActiveScale,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          {icon ? (
            <Ionicons name={icon} size={18} color="#fff" style={{ marginRight: 2 }} />
          ) : null}
          <Text style={styles.buttonText}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  disabled,
  icon,
}: {
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryBtn,
        pressed && styles.buttonActiveScale,
        disabled && { opacity: 0.6 },
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={17} color={colors.primary} style={{ marginRight: 4 }} />
      ) : null}
      <Text style={styles.secondaryBtnText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionWrapper: {
    marginLeft: 12,
  },
  alertText: { color: colors.critical },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.control,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 22,
    ...shadows.soft,
  },
  buttonActiveScale: {
    transform: [{ scale: 0.98 }],
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.stroke,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 18,
    ...shadows.soft,
  },
  dotAlert: { backgroundColor: colors.critical },
  dotGood: { backgroundColor: colors.good },
  dotWatch: { backgroundColor: colors.warning },
  empty: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.stroke,
    borderRadius: 18,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  emptyIconHalo: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderRadius: 24,
    height: 68,
    position: "absolute",
    width: 68,
  },
  emptyIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: 10,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  eyebrowContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  eyebrowDot: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  goodText: { color: colors.primary },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loading: {
    alignItems: "center",
    gap: 14,
    justifyContent: "center",
    minHeight: 260,
  },
  loadingSpinnerWrap: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 24,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  pill: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
  },
  pillAlert: {
    backgroundColor: colors.criticalSoft,
    borderColor: "rgba(217, 72, 59, 0.15)",
  },
  pillDot: {
    borderRadius: 3,
    height: 5,
    width: 5,
  },
  pillGood: {
    backgroundColor: colors.goodSoft,
    borderColor: "rgba(13, 148, 136, 0.15)",
  },
  pillText: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  pillWatch: {
    backgroundColor: colors.warningSoft,
    borderColor: "rgba(180, 83, 9, 0.15)",
  },
  secondaryBtn: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  watchText: { color: colors.warning },
});
