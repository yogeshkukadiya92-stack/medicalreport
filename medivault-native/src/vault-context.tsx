import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { normalizeReport } from "./report-analysis";
import { ApiError, apiRequest } from "@/api";
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
  updateReport: (report: AppReport) => Promise<void>;
  saveUploadedReport: (report: AppReport) => Promise<void>;
  selectMember: (memberId: string) => Promise<void>;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const accountCacheKey = user?.id ? `${cacheKey}:${user.id}` : null;
  const sessionRef = useRef(token);
  sessionRef.current = token;
  const [storedVault, setStoredVault] = useState({ token, snapshot: emptyVault });
  const vault = storedVault.token === token ? storedVault.snapshot : emptyVault;
  const setVault = useCallback((snapshot: VaultSnapshot) => {
    if (sessionRef.current === token) setStoredVault({ token, snapshot });
  }, [token]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const persist = useCallback(async (next: VaultSnapshot) => {
    if (!token) throw new Error("Please sign in to save changes.");
    await apiRequest("/vault", { body: JSON.stringify(next), method: "PUT" }, token);
    if (sessionRef.current !== token) return;
    setVault(next);
    setIsOffline(false);
    if (accountCacheKey) await AsyncStorage.setItem(accountCacheKey, JSON.stringify(next)).catch(() => null);
  }, [token, accountCacheKey, setVault]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await apiRequest<{ vault: VaultSnapshot | null }>("/vault", {}, token);
      if (sessionRef.current !== token) return;
      const snapshot = result.vault ?? emptyVault;
      const next = { ...snapshot, reports: snapshot.reports.map(normalizeReport) };
      setVault(next);
      if (accountCacheKey) await AsyncStorage.setItem(accountCacheKey, JSON.stringify(next)).catch(() => null);
      setIsOffline(false);
    } catch (error) {
      if (sessionRef.current !== token) return;
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
        setVault(emptyVault);
        setIsOffline(true);
        return;
      }
      const cached = accountCacheKey ? await AsyncStorage.getItem(accountCacheKey).catch(() => null) : null;
      if (cached) {
        try {
          const snapshot = JSON.parse(cached) as VaultSnapshot;
          if (Array.isArray(snapshot.familyMembers) && Array.isArray(snapshot.reports)) {
            setVault({ ...snapshot, reports: snapshot.reports.map(normalizeReport) });
          }
        } catch { /* Ignore invalid cache rather than crashing the vault. */ }
      }
      setIsOffline(true);
    } finally {
      if (sessionRef.current === token) setIsLoading(false);
    }
  }, [token, accountCacheKey, setVault]);

  useEffect(() => {
    void AsyncStorage.removeItem(cacheKey).catch(() => null);
    if (token) refresh();
    else {
      setVault(emptyVault);
      if (sessionRef.current === token) setIsLoading(false);
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
    updateReport: async (report) => persist({
      ...vault, reports: vault.reports.map((item) => item.id === report.id ? normalizeReport(report) : item),
    }),
    saveUploadedReport: async (report) => persist({
      ...vault,
      reports: [normalizeReport(report), ...vault.reports],
    }),
  }), [isLoading, isOffline, persist, refresh, vault]);
  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) throw new Error("VaultProvider is missing.");
  return context;
}
