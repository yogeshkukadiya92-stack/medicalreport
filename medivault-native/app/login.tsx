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
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [identifier, setIdentifier] = useState("");
  const [secret, setSecret] = useState("");
  const testingOtp = __DEV__;
  const [message, setMessage] = useState("");
  const [requestFailed, setRequestFailed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  async function submit() {
    if (isLoading || isRequesting) return;
    try {
    const normalized = normalizeLoginIdentifier(identifier);
    if (mode === "otp") {
      await signInWithOtp(normalized, secret);
    } else {
      await signIn(normalized, secret);
    }
    router.replace("/(tabs)");
    } catch { /* AuthProvider displays the error and preserves the form. */ }
  }

  async function requestOtp() {
    if (!isValidLoginIdentifier(identifier) || identifier.includes("@") || isRequesting) return;
    setMessage("");
    setRequestFailed(false);
    setIsRequesting(true);
    try {
      const result = await apiRequest<{ message?: string }>("/auth/request-otp", {
        body: JSON.stringify({
          phone: normalizeLoginIdentifier(identifier),
          purpose: "login",
        }),
        method: "POST",
      });
      setMessage(result.message || "Enter the OTP sent to your mobile number.");
      setSecret("");
    } catch (requestError) {
      setRequestFailed(true);
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
              accessibilityRole="button"
              accessibilityState={{ selected: mode === "otp" }}
              onPress={() => {
                setMode("otp");
                if (identifier.includes("@") || !identifier) setIdentifier(testingOtp ? "9876543210" : "");
                setSecret(testingOtp ? "1111" : "");
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
              accessibilityRole="button"
              accessibilityState={{ selected: mode === "password" }}
              onPress={() => {
                setMode("password");

                setSecret("");
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
                  placeholder="Email or 10-digit mobile"
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
              {mode === "otp" && testingOtp ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Use testing OTP 1111" onPress={() => setSecret("1111")} style={[styles.defaultOtpBadge, { minHeight: 44, justifyContent: "center" }]}>
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
                placeholder={mode === "otp" ? "Enter OTP" : "Enter password"}
                placeholderTextColor="#95A7A2"
                secureTextEntry={mode === "password" && !showPassword}
                style={styles.inputInner}
                value={secret}
              />
              {mode === "password" ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
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
                <Text style={styles.otpHint}>{testingOtp ? "Testing OTP: 1111" : "Request a code to sign in."}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Get OTP"
                  disabled={isLoading || isRequesting || !isValidLoginIdentifier(identifier) || identifier.includes("@")}
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

          {message && message !== error ? (
            <View accessibilityLiveRegion="polite" style={requestFailed ? styles.feedbackAlert : styles.feedbackSuccess}>
              <Ionicons name={requestFailed ? "alert-circle" : "checkmark-circle"} size={17} color={requestFailed ? colors.critical : colors.primary} />
              <Text style={requestFailed ? styles.errorText : styles.messageText}>{message}</Text>
            </View>
          ) : null}

          {/* Primary Submit Button */}
          <View style={{ marginTop: 6 }}>
            <PrimaryButton
              disabled={isLoading || isRequesting || !isValidLoginIdentifier(identifier) || (mode === "otp" ? identifier.includes("@") || !/^\d{4,6}$/.test(secret) : !secret)}
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
              Your session is stored securely on your device.
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
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "500",
  },
  panel: {
    backgroundColor: colors.card,
    borderColor: colors.stroke,
    borderRadius: radius.card,
    borderWidth: 1,
    alignSelf: "center",
    width: "90%",
    maxWidth: 460,
    marginTop: 26,
    padding: 22,
    ...shadows.medium,
  },
  phoneRow: {
    flexDirection: "row",
    gap: 8,
  },
  requestOtpBtn: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
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
    flexShrink: 1,
    textAlign: "center",
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
