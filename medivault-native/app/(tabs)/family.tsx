import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, EmptyState, PrimaryButton, ScreenHeader } from "@/components";
import { colors, radius, shadows } from "@/theme";
import { useVault } from "@/vault-context";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const COMMON_RELATIONS = ["Self", "Spouse", "Mother", "Father", "Child", "Other"];

export default function FamilyScreen() {
  const insets = useSafeAreaInsets();
  const { activeMemberId, addMember, familyMembers, reports, selectMember } =
    useVault();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    age: "",
    bloodGroup: "O+",
    name: "",
    phone: "",
    relation: "Self",
  });

  async function submit() {
    await addMember({
      age: Number(form.age) || 0,
      bloodGroup: form.bloodGroup || "Unknown",
      name: form.name,
      phone: `+91${form.phone.replace(/\D/g, "").slice(-10)}`,
      relation: form.relation,
    });
    setShowForm(false);
    setForm({ age: "", bloodGroup: "O+", name: "", phone: "", relation: "Family" });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader
        action={
          <Pressable
            accessibilityLabel="Add Family Member"
            onPress={() => setShowForm(true)}
            style={({ pressed }) => [
              styles.addBtn,
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        }
        eyebrow="Multi-Profile Management"
        subtitle="Switch profiles to view distinct medical records and trends"
        title="Family Vault"
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        {familyMembers.map((member) => {
          const selected = member.id === activeMemberId;
          const count = reports.filter((r) => r.memberId === member.id).length;
          const initials = member.name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase();

          return (
            <Pressable
              key={member.id}
              onPress={() => selectMember(member.id)}
              style={({ pressed }) => [
                styles.memberCardWrap,
                pressed && { transform: [{ scale: 0.985 }] },
              ]}
            >
              <Card style={[styles.memberCard, selected && styles.memberCardActive]}>
                <View style={[styles.avatar, selected && styles.avatarActive]}>
                  <Text style={[styles.initials, selected && styles.initialsActive]}>
                    {initials}
                  </Text>
                  {selected ? (
                    <View style={styles.activeCheckDot}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  ) : null}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{member.name}</Text>
                    {selected ? (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.meta}>
                    {member.relation} · {member.age || "--"} yrs · {member.bloodGroup || "Unknown"}
                  </Text>

                  <View style={styles.reportsCountRow}>
                    <Ionicons name="documents-outline" size={13} color={colors.primary} />
                    <Text style={styles.reportsCountText}>
                      {count} connected medical record{count === 1 ? "" : "s"}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={selected ? colors.primary : colors.subtle}
                />
              </Card>
            </Pressable>
          );
        })}

        {!familyMembers.length ? (
          <Card>
            <EmptyState
              action={
                <PrimaryButton
                  icon="person-add-outline"
                  onPress={() => setShowForm(true)}
                  title="Add first member"
                />
              }
              description="Keep health records organized for yourself, children, and parents under one unified login."
              icon="people-outline"
              title="No family profiles created"
            />
          </Card>
        ) : null}
      </ScrollView>

      {/* iOS PageSheet Modal for Adding Profile */}
      <Modal
        animationType="slide"
        onRequestClose={() => setShowForm(false)}
        presentationStyle="pageSheet"
        visible={showForm}
      >
        <View style={styles.modal}>
          {/* Sheet Handle */}
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          <View style={styles.formHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.modalEyebrowRow}>
                <View style={styles.modalEyebrowDot} />
                <Text style={styles.modalEyebrow}>NEW PATIENT PROFILE</Text>
              </View>
              <Text style={styles.formTitle}>Add Family Member</Text>
            </View>
            <Pressable onPress={() => setShowForm(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.formContent,
              { paddingBottom: insets.bottom + 36 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Full Name */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  onChangeText={(name) => setForm((curr) => ({ ...curr, name }))}
                  placeholder="e.g. Dipti Patel"
                  placeholderTextColor="#95A7A2"
                  style={styles.textInput}
                  value={form.name}
                />
              </View>
            </View>

            {/* Relation Presets */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Relation</Text>
              <View style={styles.chipsRow}>
                {COMMON_RELATIONS.map((r) => {
                  const isSel = form.relation === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setForm((c) => ({ ...c, relation: r }))}
                      style={[styles.presetChip, isSel && styles.presetChipActive]}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          isSel && styles.presetChipTextActive,
                        ]}
                      >
                        {r}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Age & Blood Group Grid */}
            <View style={styles.rowGrid}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Age</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={3}
                    onChangeText={(age) => setForm((c) => ({ ...c, age }))}
                    placeholder="32"
                    placeholderTextColor="#95A7A2"
                    style={styles.textInput}
                    value={form.age}
                  />
                </View>
              </View>

              <View style={[styles.fieldWrap, { flex: 1.4 }]}>
                <Text style={styles.fieldLabel}>Blood Group</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    autoCapitalize="characters"
                    onChangeText={(bloodGroup) => setForm((c) => ({ ...c, bloodGroup }))}
                    placeholder="e.g. O+, B+"
                    placeholderTextColor="#95A7A2"
                    style={styles.textInput}
                    value={form.bloodGroup}
                  />
                </View>
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.flagCodeBadge}>
                  <Text style={styles.flagText}>🇮🇳</Text>
                  <Text style={styles.codeText}>+91</Text>
                </View>
                <View style={[styles.inputBox, { flex: 1 }]}>
                  <TextInput
                    keyboardType="phone-pad"
                    maxLength={10}
                    onChangeText={(phone) => setForm((c) => ({ ...c, phone }))}
                    placeholder="9876543210"
                    placeholderTextColor="#95A7A2"
                    style={styles.textInput}
                    value={form.phone}
                  />
                </View>
              </View>
            </View>

            {/* Explanatory Info Card */}
            <Card style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={17} color={colors.primary} />
              <Text style={styles.infoCardText}>
                Clinical reports issued by connected diagnostic labs will automatically match and sync to this profile using the 10-digit mobile number.
              </Text>
            </Card>

            {/* Submit CTA */}
            <View style={{ marginTop: 8 }}>
              <PrimaryButton
                disabled={!form.name.trim() || form.phone.length < 10}
                icon="person-add-outline"
                onPress={submit}
                title="Save Profile"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  activeBadge: {
    backgroundColor: colors.primarySoft,
    borderColor: "rgba(13, 99, 82, 0.15)",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  activeBadgeText: {
    color: colors.primary,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  activeCheckDot: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: "#fff",
    borderRadius: 9,
    borderWidth: 2,
    bottom: -2,
    height: 18,
    justifyContent: "center",
    position: "absolute",
    right: -2,
    width: 18,
  },
  addBtn: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.control,
    height: 44,
    justifyContent: "center",
    width: 44,
    ...shadows.glow,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.stroke,
    borderRadius: 18,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  avatarActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  closeBtn: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  codeText: {
    color: colors.ink,
    fontSize: 13.5,
    fontWeight: "800",
  },
  content: {
    gap: 12,
    paddingHorizontal: 18,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 12.5,
    fontWeight: "800",
    marginBottom: 6,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  flagCodeBadge: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1.2,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 12,
  },
  flagText: {
    fontSize: 16,
  },
  formContent: {
    gap: 4,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  formHeader: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomColor: colors.stroke,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  formTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  infoCard: {
    backgroundColor: "#F2FAF7",
    borderColor: "rgba(13, 99, 82, 0.12)",
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  infoCardText: {
    color: "#305B52",
    flex: 1,
    fontSize: 11.5,
    fontWeight: "500",
    lineHeight: 18,
  },
  initials: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  initialsActive: {
    color: colors.primary,
  },
  inputBox: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.control,
    borderWidth: 1.2,
    flexDirection: "row",
    height: 50,
    paddingHorizontal: 14,
    ...shadows.soft,
  },
  inputIcon: {
    marginRight: 8,
  },
  memberCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  memberCardActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    ...shadows.medium,
  },
  memberCardWrap: {
    borderRadius: radius.card,
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  modal: {
    backgroundColor: colors.background,
    flex: 1,
  },
  modalEyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  modalEyebrowDot: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 2.5,
    height: 5,
    width: 5,
  },
  modalEyebrowRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginBottom: 4,
  },
  name: {
    color: colors.ink,
    fontSize: 15.5,
    fontWeight: "900",
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  phoneInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  presetChip: {
    backgroundColor: "#fff",
    borderColor: colors.stroke,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 7,
    ...shadows.soft,
  },
  presetChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  presetChipText: {
    color: colors.inkSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  presetChipTextActive: {
    color: "#fff",
  },
  reportsCountRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 6,
  },
  reportsCountText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  rowGrid: {
    flexDirection: "row",
    gap: 12,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sheetHandle: {
    backgroundColor: "#CBD5D1",
    borderRadius: 2.5,
    height: 5,
    width: 36,
  },
  sheetHandleWrap: {
    alignItems: "center",
    backgroundColor: "#fff",
    paddingTop: 10,
  },
  textInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
});
