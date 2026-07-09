import type { Profile } from "@/lib/types";
import type { FamilyMember } from "@/lib/vault-types";
import { createClientId, loadVaultSnapshot, saveVaultSnapshot } from "@/lib/api/vault-service";

function toProfile(member: FamilyMember): Profile {
  return {
    id: member.id,
    full_name: member.name,
    blood_group: member.bloodGroup,
    known_conditions: [],
  };
}

export const profileAPI = {
  async getProfile(): Promise<Profile> {
    const vault = await loadVaultSnapshot();
    const member = vault.familyMembers.find((item) => item.id === vault.activeMemberId) ?? vault.familyMembers[0];
    if (!member) throw new Error("Profile not found. Add a family member first.");
    return toProfile(member);
  },

  async createProfile(data: Partial<Profile>): Promise<Profile> {
    const vault = await loadVaultSnapshot();
    const name = data.full_name?.trim();
    if (!name) throw new Error("Full name is required.");
    const member: FamilyMember = {
      id: createClientId("member"),
      name,
      relation: "Self",
      score: 0,
      bloodGroup: data.blood_group?.trim() || "Unknown",
      age: data.date_of_birth ? Math.max(0, new Date().getFullYear() - new Date(data.date_of_birth).getFullYear()) : 0,
      phone: "",
    };
    await saveVaultSnapshot({
      ...vault,
      activeMemberId: member.id,
      familyMembers: [member, ...vault.familyMembers],
    });
    return toProfile(member);
  },

  async updateProfile(data: Partial<Profile>): Promise<Profile> {
    const vault = await loadVaultSnapshot();
    const activeMemberId = vault.activeMemberId ?? vault.familyMembers[0]?.id;
    if (!activeMemberId) return this.createProfile(data);
    let updated: FamilyMember | null = null;
    const familyMembers = vault.familyMembers.map((member) => {
      if (member.id !== activeMemberId) return member;
      updated = {
        ...member,
        name: data.full_name?.trim() || member.name,
        bloodGroup: data.blood_group?.trim() || member.bloodGroup,
      };
      return updated;
    });
    if (!updated) throw new Error("Profile not found.");
    await saveVaultSnapshot({ ...vault, familyMembers });
    return toProfile(updated);
  },
};
