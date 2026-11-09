import { Alert, Linking, Pressable, Text, View } from "react-native";
import { colors } from "./theme";

export function PrivacyLinks() {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
    {[["Privacy policy", "privacy-policy"], ["Help & support", "support"]].map(([label, path]) => <Pressable key={path} accessibilityRole="link" accessibilityLabel={label} onPress={() => Linking.openURL(`https://mr.yogeshaihub.in/${path}`).catch(() => Alert.alert("Link unavailable", "Please try again or contact yogeshkukadiya92@gmail.com."))} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>{label}</Text></Pressable>)}
  </View>;
}
