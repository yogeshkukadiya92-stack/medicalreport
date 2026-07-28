import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/auth-context";
import { colors } from "@/theme";

export default function Index() {
  const { isLoading, token } = useAuth();
  if (isLoading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  return <Redirect href={token ? "/(tabs)" : "/login"} />;
}

const styles = StyleSheet.create({ center: { alignItems: "center", backgroundColor: colors.background, flex: 1, justifyContent: "center" } });
