import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useAuth } from "@/auth-context";
import { useLanguage } from "@/i18n";
import { colors, shadows } from "@/theme";

export default function TabsLayout() {
  const { token } = useAuth();
  const { t } = useLanguage();

  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#8C9D99",
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: "800",
          marginTop: -2,
        },
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "home" : "home-outline"}
              size={22}
            />
          ),
          title: t("home"),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "document-text" : "document-text-outline"}
              size={22}
            />
          ),
          title: t("reports"),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.centerActionWrap, focused && styles.centerActionFocused]}>
              <Ionicons color="#fff" name="add" size={26} />
            </View>
          ),
          tabBarLabel: () => null,
          title: t("upload"),
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "analytics" : "analytics-outline"}
              size={22}
            />
          ),
          title: t("trends"),
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "people" : "people-outline"}
              size={22}
            />
          ),
          title: t("family"),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerActionFocused: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 1.05 }],
  },
  centerActionWrap: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: "#fff",
    borderRadius: 24,
    borderWidth: 3,
    height: 48,
    justifyContent: "center",
    marginBottom: Platform.OS === "ios" ? 8 : 4,
    width: 48,
    ...shadows.glow,
  },
  tabBar: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderTopColor: "rgba(13, 99, 82, 0.09)",
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 84 : 68,
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
    paddingTop: 8,
    ...shadows.soft,
  },
});
