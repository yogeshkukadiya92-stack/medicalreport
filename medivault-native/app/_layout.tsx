import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/auth-context";
import { LanguageProvider } from "@/i18n";
import { VaultProvider } from "@/vault-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <VaultProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
          </VaultProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
