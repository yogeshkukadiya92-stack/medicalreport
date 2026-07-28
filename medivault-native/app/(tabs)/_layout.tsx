import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@/auth-context";
import { useLanguage } from "@/i18n";
import { colors } from "@/theme";

export default function TabsLayout() {
  const { token } = useAuth();
  const { t } = useLanguage();
  if (!token) return <Redirect href="/login" />;
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: "#82918E",
      tabBarLabelStyle: { fontSize: 10, fontWeight: "800" },
      tabBarStyle: { borderTopColor: colors.stroke, height: 64, paddingBottom: 8, paddingTop: 6 },
    }}>
      <Tabs.Screen name="index" options={{ title: t("home"), tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} /> }} />
      <Tabs.Screen name="reports" options={{ title: t("reports"), tabBarIcon: ({ color, size }) => <Ionicons color={color} name="document-text-outline" size={size} /> }} />
      <Tabs.Screen name="upload" options={{ title: t("upload"), tabBarIcon: ({ color }) => <Ionicons color={color} name="add-circle" size={32} /> }} />
      <Tabs.Screen name="trends" options={{ title: t("trends"), tabBarIcon: ({ color, size }) => <Ionicons color={color} name="analytics-outline" size={size} /> }} />
      <Tabs.Screen name="family" options={{ title: t("family"), tabBarIcon: ({ color, size }) => <Ionicons color={color} name="people-outline" size={size} /> }} />
    </Tabs>
  );
}
