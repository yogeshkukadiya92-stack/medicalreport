import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "@/api";
import { useAuth } from "@/auth-context";
import { Card, ScreenHeader } from "@/components";
import { useLanguage, type Language } from "@/i18n";
import { colors } from "@/theme";

type Consent = { consent_type: string; is_granted: boolean };
type AccessEvent = { action: string; actor: string; createdAt: string; id: string; resource: string };
const definitions = [
  ["care_delivery", "Care delivery", "Allow clinics to process reports for your direct care."],
  ["provider_sharing", "Provider sharing", "Allow secure links that you explicitly create."],
  ["analytics", "Health analytics", "Calculate personal trends from normalized values."],
  ["research", "De-identified research", "Optional de-identified research use."],
] as const;

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, token } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [events, setEvents] = useState<AccessEvent[]>([]);

  async function load() {
    if (!token) return;
    const [consentResult, historyResult] = await Promise.all([
      apiRequest<{ consents: Consent[] }>("/consents", {}, token),
      apiRequest<{ events: AccessEvent[] }>("/access-history", {}, token),
    ]);
    setConsents(consentResult.consents);
    setEvents(historyResult.events);
  }
  useEffect(() => { load().catch(() => null); }, [token]);
  async function updateConsent(consentType: string, isGranted: boolean) {
    if (!token) return;
    await apiRequest("/consents", {
      body: JSON.stringify({ consent_type: consentType, consent_version: "2.0", is_granted: isGranted }),
      method: "POST",
    }, token);
    await load();
  }
  async function logout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top + 8 }}>
      <ScreenHeader eyebrow="Patient control center" title="Privacy" action={<Pressable onPress={() => router.back()} style={styles.close}><Ionicons name="close" size={22} color={colors.ink} /></Pressable>} />
      <View style={styles.content}>
        <Card><Text style={styles.sectionLabel}>APP LANGUAGE</Text><View style={styles.languages}>{(["en", "gu", "hi"] as Language[]).map((item) => <Pressable key={item} onPress={() => setLanguage(item)} style={[styles.language, language === item && styles.languageActive]}><Text style={[styles.languageText, language === item && { color: "#fff" }]}>{item === "en" ? "English" : item === "gu" ? "ગુજરાતી" : "हिन्दी"}</Text></Pressable>)}</View></Card>
        <Card><Text style={styles.sectionLabel}>CONSENT PREFERENCES</Text>{definitions.map(([id, label, note], index) => { const enabled = Boolean(consents.find((item) => item.consent_type === id)?.is_granted); return <View key={id} style={[styles.consent, index > 0 && styles.divider]}><View style={{ flex: 1 }}><Text style={styles.consentLabel}>{label}</Text><Text style={styles.note}>{note}</Text></View><Switch onValueChange={(value) => updateConsent(id, value)} trackColor={{ false: "#C8D4D1", true: "#7EDBC6" }} thumbColor={enabled ? colors.primary : "#fff"} value={enabled} /></View>; })}</Card>
        <Card><Text style={styles.sectionLabel}>RECENT ACCESS HISTORY</Text>{events.slice(0, 20).map((event, index) => <View key={event.id} style={[styles.event, index > 0 && styles.divider]}><View style={styles.eventIcon}><Ionicons name={event.action === "viewed" || event.action === "file_viewed" ? "eye-outline" : "shield-checkmark-outline"} size={16} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.eventTitle}>{event.action.replace(/_/g, " ")}</Text><Text style={styles.note}>{event.actor} · {event.resource}</Text></View><Text style={styles.time}>{new Date(event.createdAt).toLocaleDateString()}</Text></View>)}{!events.length ? <Text style={styles.empty}>No access activity recorded yet.</Text> : null}</Card>
        <Pressable onPress={logout} style={styles.logout}><Ionicons name="log-out-outline" size={18} color={colors.critical} /><Text style={styles.logoutText}>Sign out of MediVault</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  close: { alignItems: "center", backgroundColor: "#fff", borderColor: colors.stroke, borderRadius: 7, borderWidth: 1, height: 40, justifyContent: "center", width: 40 },
  consent: { alignItems: "center", flexDirection: "row", gap: 12, paddingVertical: 13 },
  consentLabel: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  content: { gap: 12, paddingHorizontal: 16 },
  divider: { borderTopColor: "#EDF2F1", borderTopWidth: 1 },
  empty: { color: colors.muted, fontSize: 11, fontWeight: "600", paddingVertical: 18, textAlign: "center" },
  event: { alignItems: "center", flexDirection: "row", gap: 10, paddingVertical: 12 },
  eventIcon: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: 6, height: 34, justifyContent: "center", width: 34 },
  eventTitle: { color: colors.ink, fontSize: 11, fontWeight: "900", textTransform: "capitalize" },
  language: { alignItems: "center", backgroundColor: colors.background, borderRadius: 6, flex: 1, minHeight: 40, justifyContent: "center" },
  languageActive: { backgroundColor: colors.primaryDark },
  languageText: { color: colors.ink, fontSize: 10, fontWeight: "900" },
  languages: { flexDirection: "row", gap: 7, marginTop: 12 },
  logout: { alignItems: "center", backgroundColor: colors.criticalSoft, borderRadius: 7, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 48 },
  logoutText: { color: colors.critical, fontSize: 12, fontWeight: "900" },
  note: { color: colors.muted, fontSize: 9, fontWeight: "600", lineHeight: 14, marginTop: 3 },
  screen: { backgroundColor: colors.background, flex: 1 },
  sectionLabel: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  time: { color: colors.muted, fontSize: 8, fontWeight: "700" },
});
