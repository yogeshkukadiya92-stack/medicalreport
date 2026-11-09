import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "@/api";
import { useAuth } from "@/auth-context";
import { Card, ScreenHeader, SecondaryButton, LoadingBlock, PrimaryButton } from "@/components";
import { useLanguage, type Language } from "@/i18n";
import { colors, radius, shadows } from "@/theme";
import { PrivacyLinks } from "@/privacy-links";

type Consent = { consent_type: string; is_granted: boolean };
type AccessEvent = {
  action: string;
  actor: string;
  createdAt: string;
  id: string;
  resource: string;
};

const definitions = [
  [
    "care_delivery",
    "Direct Clinical Care",
    "Allow authorized diagnostic laboratories and clinics to process and sync reports for direct care.",
  ],
  [
    "provider_sharing",
    "Doctor & Provider Links",
    "Enable expiring report links that you explicitly share with doctors.",
  ],
  [
    "analytics",
    "Personal Health Analytics",
    "Calculate biomarker velocity, longitudinal percentiles, and preventive attention alerts.",
  ],
  [
    "research",
    "De-Identified Clinical Research",
    "Contribute anonymized and aggregate health parameters to accredited clinical research.",
  ],
] as const;

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, token, isLoading: authLoading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [events, setEvents] = useState<AccessEvent[]>([]);

  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingConsent, setSavingConsent] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function deleteAccount() {
    if (!token || !deleteConfirmed || !deletePassword || deleting) return;
    setDeleting(true); setDeleteError("");
    try {
      await apiRequest("/auth/account", { method: "DELETE", body: JSON.stringify({ password: deletePassword, confirmation: "DELETE" }) }, token);
      await signOut();
      router.replace("/login");
    } catch (error) { setDeleteError(error instanceof Error ? error.message : "Account deletion could not finish. Please retry."); }
    finally { setDeleting(false); }
  }

  async function load() {
    if (!token) return;
    setLoading(true);
    setLoadError("");
    try {
    const [consentResult, historyResult] = await Promise.all([
      apiRequest<{ consents: Consent[] }>("/consents", {}, token),
      apiRequest<{ events: AccessEvent[] }>("/access-history", {}, token),
    ]);
    setConsents(consentResult.consents);
    setEvents(historyResult.events);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Privacy settings could not be loaded.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    load().catch(() => null);
  }, [token]);

  async function updateConsent(consentType: string, isGranted: boolean) {
    if (!token || savingConsent) return;
    setSavingConsent(true);
    try {
    await apiRequest(
      "/consents",
      {
        body: JSON.stringify({
          consent_type: consentType,
          consent_version: "2.0",
          is_granted: isGranted,
        }),
        method: "POST",
      },
      token
    );
    await load();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Permission could not be updated. Please retry.");
    } finally { setSavingConsent(false); }
  }

  async function finishLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
    } catch {
      setLoadError("Could not sign out securely. Please retry.");
    } finally { setSigningOut(false); }
  }

  function handleLogout() {
    if (Platform.OS === "web") { setConfirmLogout(true); return; }
    Alert.alert(
      "Sign out of MediVault",
      "Are you sure you want to log out? You will need your phone OTP or password to sign in again.",
      [
        { style: "cancel", text: "Cancel" },
        {
          onPress: finishLogout,
          style: "destructive",
          text: "Sign out",
        },
      ]
    );
  }

  if (authLoading) return <LoadingBlock message="Opening your session..." />;
  if (!token) return <Redirect href="/login" />;

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
        action={
          <Pressable
            accessibilityRole="button"
                  accessibilityLabel="Close"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
          >
            <Ionicons name="close" size={20} color={colors.ink} />
          </Pressable>
        }
        eyebrow="Patient Sovereignty"
        subtitle="Consent controls, language preferences & account activity"
        title="Privacy & Security"
      />

      <View style={styles.content}>
        {loadError ? <Card><Text accessibilityRole="alert" style={{ color: colors.critical, marginBottom: 12 }}>{loadError}</Text><SecondaryButton title="Retry privacy settings" onPress={load} disabled={loading} /></Card> : null}
        {loading ? <Text accessibilityLiveRegion="polite">Loading privacy settings...</Text> : null}
        {/* App Language Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="globe-outline" size={17} color={colors.primary} />
            <Text style={styles.sectionLabel}>NAVIGATION LANGUAGE / ભાષા / भाषा</Text>
          </View>
          <View style={styles.languagesRow}>
            {(
              [
                ["en", "English", "EN"],
                ["gu", "ગુજરાતી", "GU"],
                ["hi", "हिन्दी", "HI"],
              ] as [Language, string, string][]
            ).map(([code, label, badge]) => {
              const isSelected = language === code;
              return (
                <Pressable
                  key={code}
                  onPress={() => setLanguage(code)}
                  style={[
                    styles.languageBtn,
                    isSelected && styles.languageBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.langBadge,
                      isSelected && styles.langBadgeActive,
                    ]}
                  >
                    {badge}
                  </Text>
                  <Text
                    style={[
                      styles.languageText,
                      isSelected && styles.languageTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Consent Preferences Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="lock-closed-outline" size={17} color={colors.primary} />
            <Text style={styles.sectionLabel}>CONSENT & DATA PERMISSIONS</Text>
          </View>

          {definitions.map(([id, label, note], index) => {
            const enabled = Boolean(
              consents.find((c) => c.consent_type === id)?.is_granted
            );
            return (
              <View
                key={id}
                style={[styles.consentItem, index > 0 && styles.itemDivider]}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.consentLabel}>{label}</Text>
                  <Text style={styles.consentNote}>{note}</Text>
                </View>
                <Switch
                  accessibilityLabel={label}
                  disabled={loading || savingConsent || Boolean(loadError)}
                  onValueChange={(val) => updateConsent(id, val)}
                  thumbColor={enabled ? colors.primary : "#fff"}
                  trackColor={{
                    false: "#D1DDD9",
                    true: "rgba(13, 99, 82, 0.4)",
                  }}
                  value={enabled}
                />
              </View>
            );
          })}
        </Card>

        {/* Recent Access History Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="receipt-outline" size={17} color={colors.primary} />
            <Text style={styles.sectionLabel}>ACCESS HISTORY & AUDIT LOG</Text>
          </View>

          {events.slice(0, 15).map((event, index) => (
            <View
              key={event.id}
              style={[styles.eventRow, index > 0 && styles.itemDivider]}
            >
              <View style={styles.eventIcon}>
                <Ionicons
                  name={
                    event.action.includes("share")
                      ? "share-social-outline"
                      : event.action.includes("view")
                      ? "eye-outline"
                      : "shield-checkmark-outline"
                  }
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventAction}>
                  {event.action.replace(/_/g, " ")}
                </Text>
                <Text style={styles.eventActor}>
                  {event.actor} · {event.resource}
                </Text>
              </View>
              <Text style={styles.eventTime}>
                {new Date(event.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}

          {!loading && !loadError && !events.length ? (
            <Text style={styles.emptyHistory}>No access activity recorded yet.</Text>
          ) : null}
        </Card>

        <PrivacyLinks />
        {/* Security Assurance Banner */}
        <Card style={styles.securityBadgeCard}>
          <View style={styles.securityIconCircle}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.securityBadgeTitle}>Secure Session Storage</Text>
            <Text style={styles.securityBadgeCopy}>
              Your sign-in token is protected using secure device storage on iOS and Android.
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "800", marginBottom: 8 }}>Account deletion</Text>
          <Text style={{ color: colors.muted, lineHeight: 20, marginBottom: 8 }}>Permanently remove your MediVault login, family vault, uploaded files and share links. Independent clinic records remain with the issuing clinic.</Text>
          {!showDelete ? <SecondaryButton title="Delete my account" onPress={() => setShowDelete(true)} /> : <>
            <Text style={{ color: colors.critical, lineHeight: 20, marginBottom: 10 }}>This cannot be undone. Enter your account password to continue.</Text>
            <TextInput accessibilityLabel="Account deletion password" placeholder="Your account password" value={deletePassword} onChangeText={setDeletePassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={{ minHeight: 48, borderWidth: 1, borderColor: colors.stroke, borderRadius: 12, padding: 12, marginBottom: 8, color: colors.ink }} />
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: deleteConfirmed }} accessibilityLabel="Confirm permanent account deletion" disabled={deleting} onPress={() => setDeleteConfirmed(!deleteConfirmed)} style={{ minHeight: 48, flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 8 }}>
              <Ionicons name={deleteConfirmed ? "checkbox" : "square-outline"} size={23} color={colors.critical} />
              <Text style={{ flex: 1, color: colors.ink, lineHeight: 20 }}>I understand my account and uploaded data will be permanently deleted.</Text>
            </Pressable>
            {deleteError ? <Text accessibilityRole="alert" style={{ color: colors.critical, marginBottom: 10 }}>{deleteError}</Text> : null}
            <PrimaryButton title={deleting ? "Deleting account..." : "Permanently delete account"} disabled={deleting || !deleteConfirmed || !deletePassword} loading={deleting} onPress={deleteAccount} />
            <View style={{ marginTop: 10 }}><SecondaryButton title="Keep my account" disabled={deleting} onPress={() => { setShowDelete(false); setDeletePassword(""); setDeleteConfirmed(false); setDeleteError(""); }} /></View>
          </>}
        </Card>

        {confirmLogout ? <Card>
          <Text style={{ color: colors.ink, marginBottom: 12 }}>Sign out of MediVault? You will need to sign in again.</Text>
          <PrimaryButton title="Confirm sign out" loading={signingOut} onPress={finishLogout} />
          <View style={{ marginTop: 8 }}><SecondaryButton title="Stay signed in" disabled={signingOut} onPress={() => setConfirmLogout(false)} /></View>
        </Card> : null}
        {/* Sign Out Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out of MediVault"
          disabled={signingOut}
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="log-out-outline" size={19} color={colors.critical} />
          <Text style={styles.logoutText}>Sign out of MediVault</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  closeBtn: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
    ...shadows.soft,
  },
  consentItem: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  consentLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  consentNote: {
    color: colors.muted,
    fontSize: 11.5,
    fontWeight: "500",
    lineHeight: 17,
    marginTop: 4,
  },
  content: {
    gap: 14,
    paddingHorizontal: 18,
  },
  emptyHistory: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "500",
    paddingVertical: 16,
    textAlign: "center",
  },
  eventAction: {
    color: colors.ink,
    fontSize: 12.5,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  eventActor: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  eventIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  eventRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
  },
  eventTime: {
    color: colors.muted,
    fontSize: 10.5,
    fontWeight: "700",
  },
  itemDivider: {
    borderTopColor: colors.strokeMuted,
    borderTopWidth: 1,
  },
  langBadge: {
    backgroundColor: "rgba(13, 99, 82, 0.1)",
    borderRadius: 4,
    color: colors.primary,
    fontSize: 9.5,
    fontWeight: "900",
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  langBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "#fff",
  },
  languageBtn: {
    minWidth: 100,
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 10,
    ...shadows.soft,
  },
  languageBtnActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  languageText: {
    color: colors.inkSecondary,
    fontSize: 12.5,
    fontWeight: "800",
  },
  languageTextActive: {
    color: "#fff",
  },
  languagesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  logoutBtn: {
    alignItems: "center",
    backgroundColor: colors.criticalSoft,
    borderColor: "rgba(217, 72, 59, 0.18)",
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 50,
    marginTop: 4,
  },
  logoutText: {
    color: colors.critical,
    fontSize: 14,
    fontWeight: "800",
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sectionCard: {
    padding: 18,
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
    marginBottom: 4,
  },
  securityBadgeCard: {
    backgroundColor: "#F2FAF7",
    borderColor: "rgba(13, 99, 82, 0.15)",
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  securityBadgeCopy: {
    color: "#315B52",
    fontSize: 11.5,
    fontWeight: "500",
    lineHeight: 17,
    marginTop: 3,
  },
  securityBadgeTitle: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "900",
  },
  securityIconCircle: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    height: 46,
    justifyContent: "center",
    width: 46,
    ...shadows.soft,
  },
});
