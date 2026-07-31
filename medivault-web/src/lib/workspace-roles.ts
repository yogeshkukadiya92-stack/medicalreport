import type { LabRole, WorkspaceAccess, WorkspaceRole, WorkspaceRoleAssignments } from "@/lib/vault-types";

export const workspaceRoleOptions: Record<WorkspaceAccess, readonly WorkspaceRole[]> = {
  lab: ["lab_admin", "pathologist", "technician", "collector", "cashier", "lab_staff"],
  nutrition: ["nutrition_admin", "dietitian", "nutritionist", "nutrition_coach"],
  body_composition: ["body_composition_admin", "body_composition_specialist", "trainer"],
  patient_app: ["patient", "family_member", "caregiver"],
};

export const defaultWorkspaceRoles: Record<WorkspaceAccess, WorkspaceRole> = {
  lab: "lab_staff",
  nutrition: "nutritionist",
  body_composition: "body_composition_specialist",
  patient_app: "patient",
};

export function workspaceRoleLabel(role: WorkspaceRole) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}

export function normalizeWorkspaceRoles(
  workspaceAccess: WorkspaceAccess[],
  value?: Partial<Record<WorkspaceAccess, string>>,
  legacyLabRole: LabRole = "lab_staff",
) {
  return workspaceAccess.reduce<WorkspaceRoleAssignments>((roles, workspace) => {
    const requested = value?.[workspace];
    roles[workspace] = requested && workspaceRoleOptions[workspace].includes(requested as WorkspaceRole)
      ? requested as WorkspaceRole
      : workspace === "lab"
        ? legacyLabRole
        : defaultWorkspaceRoles[workspace];
    return roles;
  }, {});
}
