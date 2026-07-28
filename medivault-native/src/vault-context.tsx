import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest } from "@/api";
import { useAuth } from "@/auth-context";
import type { AppReport, FamilyMember, VaultSnapshot } from "@/types";

const cacheKey = "medivault_vault_cache_v1";
const emptyVault: VaultSnapshot = { activeMemberId: null, familyMembers: [], reports: [] };

type VaultContextValue = VaultSnapshot & {
  activeMember: FamilyMember | null;
  addMember: (input: Omit<FamilyMember, "id" | "score">) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  isLoading: boolean;
  isOffline: boolean;
  refresh: () => Promise<void>;
  saveUploadedReport: (report: AppReport) => Promise<void>;
  selectMember: (memberId: string) => Promise<void>;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [vault, setVault] = useState<VaultSnapshot>(emptyVault);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const persist = useCallback(async (next: VaultSnapshot) => {
    setVault(next);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(next));
    if (token) await apiRequest("/vault", { body: JSON.stringify(next), method: "PUT" }, token);
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await apiRequest<{ vault: VaultSnapshot | null }>("/vault", {}, token);
      const next = result.vault ?? emptyVault;
      setVault(next);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(next));
      setIsOffline(false);
    } catch {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) setVault(JSON.parse(cached) as VaultSnapshot);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) refresh();
    else {
      setVault(emptyVault);
      setIsLoading(false);
    }
  }, [refresh, token]);

  const value = useMemo<VaultContextValue>(() => ({
    ...vault,
    activeMember: vault.familyMembers.find((item) => item.id === vault.activeMemberId) ?? vault.familyMembers[0] ?? null,
    isLoading,
    isOffline,
    refresh,
    selectMember: async (memberId) => persist({ ...vault, activeMemberId: memberId }),
    addMember: async (input) => {
      const member: FamilyMember = {
        ...input,
        id: `member-${Date.now()}`,
        score: 0,
      };
      await persist({
        ...vault,
        activeMemberId: member.id,
        familyMembers: [...vault.familyMembers, member],
      });
    },
    deleteReport: async (reportId) => persist({
      ...vault,
      reports: vault.reports.filter((report) => report.id !== reportId || report.source === "lab"),
    }),
    saveUploadedReport: async (report) => persist({
      ...vault,
      reports: [report, ...vault.reports],
    }),
  }), [isLoading, isOffline, persist, refresh, vault]);
  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) throw new Error("VaultProvider is missing.");
  return context;
}
