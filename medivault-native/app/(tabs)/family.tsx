import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, EmptyState, PrimaryButton, ScreenHeader } from "@/components";
import { colors } from "@/theme";
import { useVault } from "@/vault-context";

export default function FamilyScreen() {
  const insets = useSafeAreaInsets();
  const { activeMemberId, addMember, familyMembers, reports, selectMember } = useVault();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ age: "", bloodGroup: "", name: "", phone: "", relation: "Self" });

  async function submit() {
    await addMember({
      age: Number(form.age) || 0,
      bloodGroup: form.bloodGroup || "Unknown",
      name: form.name,
      phone: `+91${form.phone.replace(/\D/g, "").slice(-10)}`,
      relation: form.relation,
    });
    setShowForm(false);
    setForm({ age: "", bloodGroup: "", name: "", phone: "", relation: "Family" });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader eyebrow="Connected profiles" title="Family" action={<Pressable onPress={() => setShowForm(true)} style={styles.add}><Ionicons name="add" size={24} color="#fff" /></Pressable>} />
      <ScrollView contentContainerStyle={styles.content}>
        {familyMembers.map((member) => {
          const selected = member.id === activeMemberId;
          const count = reports.filter((report) => report.memberId === member.id).length;
          return <Pressable key={member.id} onPress={() => selectMember(member.id)}><Card style={[styles.member, selected && styles.memberActive]}><View style={[styles.avatar, selected && { backgroundColor: colors.primary }]}><Text style={[styles.initials, selected && { color: "#fff" }]}>{member.name.split(/\s+/).slice(0, 2).map((item) => item[0]).join("").toUpperCase()}</Text></View><View style={{ flex: 1 }}><View style={styles.nameRow}><Text style={styles.name}>{member.name}</Text>{selected ? <Text style={styles.active}>ACTIVE</Text> : null}</View><Text style={styles.meta}>{member.relation} · {member.age || "--"} years · {member.bloodGroup}</Text><Text style={styles.reports}>{count} report{count === 1 ? "" : "s"} connected</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Card></Pressable>;
        })}
        {!familyMembers.length ? <Card><EmptyState icon="people-outline" title="Your family vault is empty" description="Add yourself or a family member. Reports connect through the saved mobile number." /></Card> : null}
      </ScrollView>
      <Modal animationType="slide" onRequestClose={() => setShowForm(false)} presentationStyle="pageSheet" visible={showForm}>
        <ScrollView keyboardShouldPersistTaps="handled" style={styles.modal} contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top + 16 }}>
          <View style={styles.formHeader}><View><Text style={styles.eyebrow}>NEW PROFILE</Text><Text style={styles.formTitle}>Add family member</Text></View><Pressable onPress={() => setShowForm(false)} style={styles.close}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View>
          <View style={styles.form}>
            <TextInput onChangeText={(name) => setForm((current) => ({ ...current, name }))} placeholder="Full name" placeholderTextColor="#8C9C98" style={styles.input} value={form.name} />
            <TextInput onChangeText={(relation) => setForm((current) => ({ ...current, relation }))} placeholder="Relation (Self, Mother, Father...)" placeholderTextColor="#8C9C98" style={styles.input} value={form.relation} />
            <View style={styles.grid}><TextInput keyboardType="number-pad" onChangeText={(age) => setForm((current) => ({ ...current, age }))} placeholder="Age" placeholderTextColor="#8C9C98" style={[styles.input, { flex: 1 }]} value={form.age} /><TextInput autoCapitalize="characters" onChangeText={(bloodGroup) => setForm((current) => ({ ...current, bloodGroup }))} placeholder="Blood group" placeholderTextColor="#8C9C98" style={[styles.input, { flex: 1 }]} value={form.bloodGroup} /></View>
            <View style={styles.grid}><View style={styles.code}><Text style={styles.codeText}>India +91</Text></View><TextInput keyboardType="phone-pad" maxLength={10} onChangeText={(phone) => setForm((current) => ({ ...current, phone }))} placeholder="Mobile number" placeholderTextColor="#8C9C98" style={[styles.input, { flex: 1 }]} value={form.phone} /></View>
            <Text style={styles.note}>Published clinic reports automatically match this profile using the mobile number.</Text>
            <PrimaryButton disabled={!form.name.trim() || form.phone.length < 10} onPress={submit} title="Save profile" />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  active: { backgroundColor: colors.primarySoft, borderRadius: 4, color: colors.primary, fontSize: 8, fontWeight: "900", paddingHorizontal: 6, paddingVertical: 4 },
  add: { alignItems: "center", backgroundColor: colors.primary, borderRadius: 7, height: 42, justifyContent: "center", width: 42 },
  avatar: { alignItems: "center", backgroundColor: colors.primarySoft, borderRadius: 8, height: 46, justifyContent: "center", width: 46 },
  close: { alignItems: "center", backgroundColor: colors.background, borderRadius: 7, height: 40, justifyContent: "center", width: 40 },
  code: { alignItems: "center", backgroundColor: "#F5F8F7", borderColor: colors.stroke, borderRadius: 7, borderWidth: 1, justifyContent: "center", paddingHorizontal: 12 },
  codeText: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  content: { gap: 10, padding: 16 },
  eyebrow: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  form: { gap: 12, padding: 18 },
  formHeader: { alignItems: "center", borderBottomColor: colors.stroke, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 18 },
  formTitle: { color: colors.ink, fontSize: 22, fontWeight: "900", marginTop: 4 },
  grid: { flexDirection: "row", gap: 9 },
  initials: { color: colors.primary, fontSize: 12, fontWeight: "900" },
  input: { backgroundColor: "#fff", borderColor: colors.stroke, borderRadius: 7, borderWidth: 1, color: colors.ink, fontSize: 13, fontWeight: "700", height: 48, paddingHorizontal: 13 },
  member: { alignItems: "center", flexDirection: "row", gap: 12 },
  memberActive: { borderColor: colors.primary },
  meta: { color: colors.muted, fontSize: 10, fontWeight: "600", marginTop: 5 },
  modal: { backgroundColor: colors.background, flex: 1 },
  name: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  nameRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  note: { color: colors.muted, fontSize: 10, fontWeight: "600", lineHeight: 16 },
  reports: { color: colors.primary, fontSize: 9, fontWeight: "800", marginTop: 5 },
  screen: { backgroundColor: colors.background, flex: 1 },
});
