import type { FamilyMember as LegacyFamilyMember } from "@/lib/types";
import type { FamilyMember } from "@/lib/vault-types";
import { createClientId, loadVaultSnapshot, saveVaultSnapshot } from "@/lib/api/vault-service";

function toLegacyMember(member: FamilyMember, reportCount: number, isDefault: boolean): LegacyFamilyMember {
  return {
    id: member.id,
    full_name: member.name,
    relation: member.relation,
    age: member.age || undefined,
    blood_group: member.bloodGroup,
    known_conditions: [],
    is_default: isDefault,
    report_count: reportCount,
  };
}

function memberReportCount(memberId: string, snapshotReports: Array<{ memberId: string }>) {
  return snapshotReports.filter((report) => report.memberId === memberId).length;
}

export const familyAPI = {
  async listMembers(): Promise<LegacyFamilyMember[]> {
    const vault = await loadVaultSnapshot();
    return vault.familyMembers.map((member) =>
      toLegacyMember(member, memberReportCount(member.id, vault.reports), vault.activeMemberId === member.id),
    );
  },

  async getMember(id: string): Promise<LegacyFamilyMember> {
    const vault = await loadVaultSnapshot();
    const member = vault.familyMembers.find((item) => item.id === id);
    if (!member) throw new Error("Member not found");
    return toLegacyMember(member, memberReportCount(member.id, vault.reports), vault.activeMemberId === member.id);
  },

  async addMember(data: Partial<LegacyFamilyMember> & { phone?: string }): Promise<LegacyFamilyMember> {
    const vault = await loadVaultSnapshot();
    const name = data.full_name?.trim();
    if (!name) throw new Error("Family member name is required.");
    const member: FamilyMember = {
      id: createClientId("member"),
      name,
      relation: data.relation?.trim() || "Family",
      age: data.age ?? 0,
      bloodGroup: data.blood_group?.trim() || "Unknown",
      phone: data.phone?.trim() || "",
      score: 0,
    };
    const saved = await saveVaultSnapshot({
      ...vault,
      activeMemberId: vault.activeMemberId ?? member.id,
      familyMembers: [...vault.familyMembers, member],
    });
    return toLegacyMember(member, memberReportCount(member.id, saved.reports), saved.activeMemberId === member.id);
  },

  async updateMember(id: string, data: Partial<LegacyFamilyMember> & { phone?: string }): Promise<LegacyFamilyMember> {
    const vault = await loadVaultSnapshot();
    let updatedMember: FamilyMember | null = null;
    const familyMembers = vault.familyMembers.map((member) => {
      if (member.id !== id) return member;
      updatedMember = {
        ...member,
        name: data.full_name?.trim() || member.name,
        relation: data.relation?.trim() || member.relation,
        age: data.age ?? member.age,
        bloodGroup: data.blood_group?.trim() || member.bloodGroup,
        phone: data.phone?.trim() ?? member.phone,
      };
      return updatedMember;
    });
    if (!updatedMember) throw new Error("Member not found");
    const reports = vault.reports.map((report) => (report.memberId === id ? { ...report, memberName: updatedMember?.name ?? report.memberName } : report));
    const saved = await saveVaultSnapshot({ ...vault, familyMembers, reports });
    return toLegacyMember(updatedMember, memberReportCount(id, saved.reports), saved.activeMemberId === id);
  },

  async deleteMember(id: string): Promise<void> {
    const vault = await loadVaultSnapshot();
    const familyMembers = vault.familyMembers.filter((member) => member.id !== id);
    await saveVaultSnapshot({
      activeMemberId: vault.activeMemberId === id ? familyMembers[0]?.id ?? null : vault.activeMemberId,
      familyMembers,
      reports: vault.reports.filter((report) => report.memberId !== id),
    });
  },

  async setDefaultMember(id: string): Promise<LegacyFamilyMember> {
    const vault = await loadVaultSnapshot();
    const member = vault.familyMembers.find((item) => item.id === id);
    if (!member) throw new Error("Member not found");
    const saved = await saveVaultSnapshot({ ...vault, activeMemberId: id });
    return toLegacyMember(member, memberReportCount(id, saved.reports), true);
  },
};
