import apiClient from "@/lib/api-client";
import type { VaultSnapshot } from "@/lib/vault-types";

export const emptyVaultSnapshot: VaultSnapshot = {
  activeMemberId: null,
  familyMembers: [],
  reports: [],
};

export async function loadVaultSnapshot(): Promise<VaultSnapshot> {
  const response = await apiClient.get<{ vault?: VaultSnapshot | null }>("/vault");
  return response.data.vault ?? emptyVaultSnapshot;
}

export async function saveVaultSnapshot(snapshot: VaultSnapshot): Promise<VaultSnapshot> {
  const response = await apiClient.put<{ vault?: VaultSnapshot }>("/vault", snapshot);
  return response.data.vault ?? snapshot;
}

export function createClientId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isoFromCreatedAt(createdAt: number | undefined) {
  return new Date(createdAt && Number.isFinite(createdAt) ? createdAt : Date.now()).toISOString();
}
