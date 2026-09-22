import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "@/api";
import { useAuth } from "@/auth-context";
import { PrimaryButton } from "@/components";
import { isValidLoginIdentifier, normalizeLoginIdentifier } from "@/login-identifier";
import { colors, radius, shadows } from "@/theme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { error, isLoading, signIn, signInWithOtp } = useAuth();
  const [mode, setMode] = useState<"password" | "otp">("otp");
  const [identifier, setIdentifier] = useState("9876543210");
  const [secret, setSecret] = useState("1111");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  async function submit() {
    const normalized = normalizeLoginIdentifier(identifier);
    if (mode === "otp") {
      await signInWithOtp(normalized, secret);
    } else {
      await signIn(normalized, secret);
    }
    router.replace("/(tabs)");
  }

  async function requestOtp() {
    setMessage("");
    setIsRequesting(true);
    try {
      const result = await apiRequest<{ message?: string }>("/auth/request-otp", {
        body: JSON.stringify({
          phone: normalizeLoginIdentifier(identifier),
          purpose: "login",
        }),
        method: "POST",
      });
      setMessage(result.message || "OTP generated successfully. Default OTP: 1111");
      setSecret("1111");
    } catch (requestError) {
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Could not request OTP. Please try again."
      );
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 28,
            paddingTop: insets.top + 28,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Hero Visual */}
        <View style={styles.brand}>
          <View style={styles.shieldHaloOuter}>
            <View style={styles.shieldHaloInner}>
              <View style={styles.logoBadge}>
                <Ionicons name="shield-checkmark" size={30} color="#fff" />
              </View>
            </View>
          </View>
          <Text style={styles.brandName}>MediVault</Text>
          <Text style={styles.brandTagline}>Secure Clinical Health Vault</Text>
          <Text style={styles.brandCopy}>
            Unified medical history, longitudinal biomarkers & private family diagnostics.
          </Text>
        </View>

        {/* Login Card Panel */}
        <View style={styles.panel}>
          {/* iOS Segmented Control */}
          <View style={styles.segment}>
            <Pressable
              onPress={() => {
                setMode("otp");
                setIdentifier("9876543210");
                setSecret("1111");
                setMessage("");
              }}
              style={[styles.segmentButton, mode === "otp" && styles.segmentActive]}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={15}
                color={mode === "otp" ? "#fff" : colors.muted}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  mode === "otp" && styles.segmentTextActive,
                ]}
              >
                Mobile OTP
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMode("password");
                setIdentifier("priyank@medivault.in");
                setSecret("MediVault#2026");
                setMessage("");
              }}
              style={[styles.segmentButton, mode === "password" && styles.segmentActive]}
            >
              <Ionicons
                name="key-outline"
                size={15}
                color={mode === "password" ? "#fff" : colors.muted}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  mode === "password" && styles.segmentTextActive,
                ]}
              >
                Password
              </Text>
            </Pressable>
          </View>

          {/* Identifier Input */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>
              {mode === "password" ? "Email or mobile number" : "Mobile number"}
            </Text>
            {mode === "password" ? (
              <View style={styles.inputWrap}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.muted}
                  style={styles.inputLeadingIcon}
                />
                <TextInput
                  accessibilityLabel="Email or mobile number"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={setIdentifier}
                  placeholder="name@example.com or 9876543210"
                  placeholderTextColor="#95A7A2"
                  style={styles.inputInner}
                  value={identifier}
                />
              </View>
            ) : (
              <View style={styles.phoneRow}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryFlag}>🇮🇳</Text>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <TextInput
                    accessibilityLabel="Mobile number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    onChangeText={setIdentifier}
                    placeholder="9876543210"
                    placeholderTextColor="#95A7A2"
                    style={styles.inputInner}
                    value={identifier}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Secret / OTP Input */}
          <View style={styles.fieldBlock}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>
                {mode === "otp" ? "One-time password (OTP)" : "Password"}
              </Text>
              {mode === "otp" ? (
                <Pressable
                  onPress={() => setSecret("1111")}
                  style={styles.defaultOtpBadge}
                >
                  <Text style={styles.defaultOtpBadgeText}>Use 1111</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.inputWrap}>
              <Ionicons
                name={mode === "otp" ? "shield-outline" : "lock-closed-outline"}
                size={18}
                color={colors.muted}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                accessibilityLabel={mode === "otp" ? "One-time password" : "Password"}
                keyboardType={mode === "otp" ? "number-pad" : "default"}
                maxLength={mode === "otp" ? 6 : undefined}
                onChangeText={setSecret}
                placeholder={mode === "otp" ? "Enter OTP (Default: 1111)" : "Enter password"}
                placeholderTextColor="#95A7A2"
                secureTextEntry={mode === "password" && !showPassword}
                style={styles.inputInner}
                value={secret}
              />
              {mode === "password" ? (
                <Pressable
                  accessibilityLabel="Show password"
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={19}
                    color={colors.muted}
                  />
                </Pressable>
              ) : null}
            </View>

            {mode === "otp" ? (
              <View style={styles.otpActionRow}>
                <Text style={styles.otpHint}>Default OTP is 1111 for instant testing.</Text>
                <Pressable
                  disabled={isRequesting || identifier.length < 10}
                  onPress={requestOtp}
                  style={styles.requestOtpBtn}
                >
                  <Text style={styles.requestOtpText}>
                    {isRequesting ? "Sending..." : "Get OTP"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {/* Error & Success Messages */}
          {error ? (
            <View style={styles.feedbackAlert}>
              <Ionicons name="alert-circle" size={17} color={colors.critical} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {message ? (
            <View style={styles.feedbackSuccess}>
              <Ionicons name="checkmark-circle" size={17} color={colors.primary} />
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}

          {/* Primary Submit Button */}
          <View style={{ marginTop: 6 }}>
            <PrimaryButton
              disabled={isLoading || !isValidLoginIdentifier(identifier) || !secret}
              icon="lock-closed-outline"
              loading={isLoading}
              onPress={submit}
              title={isLoading ? "Authenticating..." : "Secure sign in"}
            />
          </View>

          {/* Trust Footnote */}
          <View style={styles.trustBanner}>
            <Ionicons name="finger-print-outline" size={15} color={colors.primary} />
            <Text style={styles.securityText}>
              256-bit encrypted keyring · HIPAA & DPDP Compliant
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  brandCopy: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 320,
    textAlign: "center",
  },
  brandName: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 14,
  },
  brandTagline: {
    color: colors.primary,
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginTop: 2,
    textTransform: "uppercase",
  },
  countryCodeBadge: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 12,
  },
  countryCodeText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  countryFlag: {
    fontSize: 16,
  },
  defaultOtpBadge: {
    backgroundColor: colors.primarySoft,
    borderColor: "rgba(13, 99, 82, 0.15)",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  defaultOtpBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
  },
  errorText: {
    color: colors.critical,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  eyeBtn: {
    alignItems: "center",
    height: 50,
    justifyContent: "center",
    width: 44,
  },
  feedbackAlert: {
    alignItems: "center",
    backgroundColor: colors.criticalSoft,
    borderColor: "rgba(217, 72, 59, 0.2)",
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    padding: 12,
  },
  feedbackSuccess: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: "rgba(13, 99, 82, 0.2)",
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    padding: 12,
  },
  fieldBlock: {
    marginBottom: 16,
  },
  inputInner: {
    color: colors.ink,
    flex: 1,
    fontSize: 14.5,
    fontWeight: "700",
    minHeight: 50,
    paddingRight: 12,
  },
  inputLeadingIcon: {
    marginRight: 9,
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1.2,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: 14,
    ...shadows.soft,
  },
  label: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  logoBadge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 20,
    height: 56,
    justifyContent: "center",
    width: 56,
    ...shadows.glow,
  },
  messageText: {
    color: colors.primary,
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  otpActionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  otpHint: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "500",
  },
  panel: {
    backgroundColor: colors.card,
    borderColor: colors.stroke,
    borderRadius: radius.card,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 26,
    padding: 22,
    ...shadows.medium,
  },
  phoneRow: {
    flexDirection: "row",
    gap: 8,
  },
  requestOtpBtn: {
    paddingVertical: 4,
  },
  requestOtpText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  securityText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  segment: {
    backgroundColor: "#EDF4F1",
    borderRadius: radius.control,
    flexDirection: "row",
    marginBottom: 20,
    padding: 3.5,
  },
  segmentActive: {
    backgroundColor: colors.primaryDark,
    ...shadows.soft,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: radius.control - 2,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 40,
  },
  segmentText: {
    color: colors.muted,
    fontSize: 12.5,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#fff",
  },
  shieldHaloInner: {
    alignItems: "center",
    backgroundColor: "rgba(13, 99, 82, 0.1)",
    borderRadius: 34,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  shieldHaloOuter: {
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderRadius: 42,
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  trustBanner: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 18,
  },
});
