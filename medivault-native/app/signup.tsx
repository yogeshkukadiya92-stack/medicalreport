import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/auth-context";
import { PrimaryButton } from "@/components";
import { colors } from "@/theme";

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { signUp, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    if (isLoading) return;
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Enter a valid email address."); return; }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) { setError("Use at least 8 characters with a letter and a number."); return; }
    if (password !== confirmation) { setError("Your passwords do not match."); return; }
    try { await signUp(email.trim().toLowerCase(), password, name.trim()); router.replace("/(tabs)/family"); }
    catch (e) { setError(e instanceof Error ? e.message : "Your account could not be created. Please try again."); }
  }
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 20, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24, justifyContent: "center", alignItems: "center" }}>
      <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.title}>Create your free account</Text>
        <Text style={styles.copy}>All mobile features are free. Sign up with an email and password, then add your family profile to start uploading reports.</Text>
        <Text style={styles.label}>Name (optional)</Text>
        <TextInput accessibilityLabel="Your name" value={name} onChangeText={setName} maxLength={80} placeholder="Your name" autoComplete="name" style={styles.input} />
        <Text style={styles.label}>Email address</Text>
        <TextInput accessibilityLabel="Signup email address" value={email} onChangeText={setEmail} maxLength={254} placeholder="you@example.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" style={styles.input} />
        <Text style={styles.label}>Password</Text>
        <TextInput accessibilityLabel="Create password" value={password} onChangeText={setPassword} maxLength={256} placeholder="At least 8 characters, letters and numbers" secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} textContentType="newPassword" style={styles.input} />
        <Text style={styles.label}>Confirm password</Text>
        <TextInput accessibilityLabel="Confirm password" value={confirmation} onChangeText={setConfirmation} maxLength={256} placeholder="Enter the same password" secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} textContentType="newPassword" style={styles.input} />
        <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? "Hide passwords" : "Show passwords"} onPress={() => setShowPassword(!showPassword)} style={styles.action}><Text style={styles.link}>{showPassword ? "Hide passwords" : "Show passwords"}</Text></Pressable>
        {error ? <Text accessibilityRole="alert" style={{ color: colors.critical, marginBottom: 12 }}>{error}</Text> : null}
        <PrimaryButton title={isLoading ? "Creating account..." : "Create free account"} loading={isLoading} disabled={isLoading || !email.trim() || !password || !confirmation} onPress={submit} />
        <Text style={styles.copy}>Use your email and password to sign in. Signing up does not link clinic records to an unverified mobile number.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to sign in" disabled={isLoading} onPress={() => router.replace("/login")} style={styles.action}><Text style={styles.link}>Already have an account? Sign in</Text></Pressable>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  panel: { width: "100%", maxWidth: 460, backgroundColor: "white", borderRadius: 22, padding: 22 },
  title: { color: colors.ink, fontSize: 25, fontWeight: "800" },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 12, marginBottom: 12 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700", marginTop: 12, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: colors.stroke, borderRadius: 12, padding: 13, minHeight: 48, fontSize: 14, color: colors.ink },
  action: { minHeight: 44, justifyContent: "center", alignItems: "center", marginTop: 5 },
  link: { color: colors.primary, fontSize: 13, fontWeight: "700" },
});
