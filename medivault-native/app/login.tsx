import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "@/api";
import { useAuth } from "@/auth-context";
import { PrimaryButton } from "@/components";
import { isValidLoginIdentifier, normalizeLoginIdentifier } from "@/login-identifier";
import { colors, radius } from "@/theme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { error, isLoading, signIn, signInWithOtp } = useAuth();
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [identifier, setIdentifier] = useState("");
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit() {
    const normalized = normalizeLoginIdentifier(identifier);
    if (mode === "otp") await signInWithOtp(normalized, secret);
    else await signIn(normalized, secret);
    router.replace("/(tabs)");
  }

  async function requestOtp() {
    setMessage("");
    try {
      const result = await apiRequest<{ message?: string }>("/auth/request-otp", {
        body: JSON.stringify({ phone: normalizeLoginIdentifier(identifier), purpose: "login" }),
        method: "POST",
      });
      setMessage(result.message || "OTP sent.");
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "OTP could not be sent.");
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.brand}><View style={styles.logo}><Ionicons name="shield-checkmark-outline" size={28} color="#fff" /></View><Text style={styles.brandName}>MediVault</Text><Text style={styles.brandCopy}>Your private medical history, connected across reports, clinics and family.</Text></View>
      <View style={styles.panel}>
        <View style={styles.segment}>
          <Pressable onPress={() => { setMode("password"); setIdentifier(""); setSecret(""); }} style={[styles.segmentButton, mode === "password" && styles.segmentActive]}><Text style={[styles.segmentText, mode === "password" && styles.segmentTextActive]}>Password</Text></Pressable>
          <Pressable onPress={() => { setMode("otp"); setIdentifier(""); setSecret(""); }} style={[styles.segmentButton, mode === "otp" && styles.segmentActive]}><Text style={[styles.segmentText, mode === "otp" && styles.segmentTextActive]}>Mobile OTP</Text></Pressable>
        </View>
        <Text style={styles.label}>{mode === "password" ? "Email or mobile number" : "Mobile number"}</Text>
        {mode === "password" ? (
          <TextInput accessibilityLabel="Email or mobile number" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" onChangeText={setIdentifier} placeholder="name@example.com or 9876543210" placeholderTextColor="#93A29E" style={styles.input} value={identifier} />
        ) : (
          <View style={styles.phoneRow}><View style={styles.country}><Text style={styles.countryText}>India +91</Text></View><TextInput accessibilityLabel="Mobile number" keyboardType="phone-pad" maxLength={10} onChangeText={setIdentifier} placeholder="9876543210" placeholderTextColor="#93A29E" style={[styles.input, { flex: 1 }]} value={identifier} /></View>
        )}
        <Text style={styles.label}>{mode === "otp" ? "One-time password" : "Password"}</Text>
        <View style={styles.secretRow}><TextInput accessibilityLabel={mode === "otp" ? "One-time password" : "Password"} keyboardType={mode === "otp" ? "number-pad" : "default"} onChangeText={setSecret} placeholder={mode === "otp" ? "Enter OTP" : "Enter password"} placeholderTextColor="#93A29E" secureTextEntry={mode === "password" && !showPassword} style={[styles.input, { flex: 1, borderWidth: 0 }]} value={secret} /><Pressable accessibilityLabel="Show password" onPress={() => setShowPassword((value) => !value)} style={styles.eye}>{mode === "password" ? <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={19} color={colors.muted} /> : null}</Pressable></View>
        {mode === "otp" ? <Pressable onPress={requestOtp} style={styles.otpButton}><Text style={styles.otpText}>Send OTP</Text></Pressable> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <PrimaryButton disabled={isLoading || !isValidLoginIdentifier(identifier) || !secret} icon="lock-closed-outline" onPress={submit} title={isLoading ? "Signing in..." : "Secure sign in"} />
        <Text style={styles.security}>Protected with encrypted device storage and 30-day revocable sessions.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center", paddingHorizontal: 28 },
  brandCopy: { color: colors.muted, fontSize: 13, fontWeight: "600", lineHeight: 20, marginTop: 9, maxWidth: 330, textAlign: "center" },
  brandName: { color: colors.ink, fontSize: 28, fontWeight: "900", marginTop: 12 },
  country: { alignItems: "center", backgroundColor: "#F5F8F7", borderColor: colors.stroke, borderRadius: radius.control, borderWidth: 1, justifyContent: "center", paddingHorizontal: 11 },
  countryText: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  error: { backgroundColor: colors.criticalSoft, borderRadius: radius.control, color: colors.critical, fontSize: 11, fontWeight: "700", marginBottom: 12, padding: 11 },
  eye: { alignItems: "center", height: 48, justifyContent: "center", width: 44 },
  input: { backgroundColor: "#fff", borderColor: colors.stroke, borderRadius: radius.control, borderWidth: 1, color: colors.ink, fontSize: 14, fontWeight: "700", minHeight: 48, paddingHorizontal: 13 },
  label: { color: colors.ink, fontSize: 11, fontWeight: "800", marginBottom: 7, marginTop: 15 },
  logo: { alignItems: "center", backgroundColor: colors.primaryDark, borderRadius: 8, height: 54, justifyContent: "center", width: 54 },
  message: { backgroundColor: colors.primarySoft, borderRadius: radius.control, color: colors.primary, fontSize: 11, fontWeight: "700", marginBottom: 12, padding: 11 },
  otpButton: { alignSelf: "flex-end", paddingVertical: 10 },
  otpText: { color: colors.primary, fontSize: 11, fontWeight: "900" },
  panel: { backgroundColor: "#fff", borderColor: colors.stroke, borderRadius: 8, borderWidth: 1, marginHorizontal: 20, marginTop: 34, padding: 18 },
  phoneRow: { flexDirection: "row", gap: 8 },
  screen: { backgroundColor: colors.background, flex: 1, justifyContent: "center" },
  secretRow: { alignItems: "center", backgroundColor: "#fff", borderColor: colors.stroke, borderRadius: radius.control, borderWidth: 1, flexDirection: "row", marginBottom: 14 },
  security: { color: colors.muted, fontSize: 10, fontWeight: "600", lineHeight: 15, marginTop: 14, textAlign: "center" },
  segment: { backgroundColor: "#F1F6F4", borderRadius: radius.control, flexDirection: "row", padding: 3 },
  segmentActive: { backgroundColor: colors.primaryDark },
  segmentButton: { alignItems: "center", borderRadius: 5, flex: 1, minHeight: 38, justifyContent: "center" },
  segmentText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  segmentTextActive: { color: "#fff" },
});
