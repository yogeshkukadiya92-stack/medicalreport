import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { ApiError, apiRequest } from "@/api";
import type { AuthUser } from "@/types";

const tokenKey = "medivault_access_token";

async function readToken() {
  if (Platform.OS === "web") return globalThis.localStorage?.getItem(tokenKey) ?? null;
  return SecureStore.getItemAsync(tokenKey);
}

async function writeToken(value: string) {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(tokenKey, value);
    return;
  }
  await SecureStore.setItemAsync(tokenKey, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function removeToken() {
  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem(tokenKey);
    return;
  }
  await SecureStore.deleteItemAsync(tokenKey);
}

type AuthContextValue = {
  error: string;
  isLoading: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signInWithOtp: (phone: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  token: string | null;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    readToken().then(async (storedToken) => {
      if (!storedToken) return;
      try {
        const result = await apiRequest<{ user: AuthUser | null }>("/auth/session", {}, storedToken);
        if (!result.user?.id) {
          await removeToken();
          return;
        }
        setToken(storedToken);
        setUser(result.user);
      } catch (error) {
        if (error instanceof ApiError && [401, 403].includes(error.status)) await removeToken();
        else setToken(storedToken);
      }
    }).catch(() => setError("Your saved session could not be opened. Please sign in again.")).finally(() => setIsLoading(false));
  }, []);

  async function authenticate(input: { action: "login" | "otp_login"; otp?: string; password?: string; phone: string }) {
    setError("");
    setIsLoading(true);
    try {
      const result = await apiRequest<{ accessToken: string; user: AuthUser }>("/auth/mobile", {
        body: JSON.stringify(input),
        method: "POST",
      });
      await writeToken(result.accessToken);
      setToken(result.accessToken);
      setUser(result.user);
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Sign in failed.";
      setError(message);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }

  const value = useMemo<AuthContextValue>(() => ({
    error,
    isLoading,
    token,
    user,
    signIn: (phone, password) => authenticate({ action: "login", password, phone }),
    signInWithOtp: (phone, otp) => authenticate({ action: "otp_login", otp, phone }),
    signOut: async () => {
      if (token) await apiRequest("/auth/logout", { method: "POST" }, token).catch(() => null);
      await removeToken();
      if (user?.id) await AsyncStorage.removeItem(`medivault_vault_cache_v1:${user.id}`).catch(() => null);
      if (Platform.OS !== "web" && FileSystem.cacheDirectory) {
        await FileSystem.deleteAsync(`${FileSystem.cacheDirectory}medivault-previews/`, { idempotent: true }).catch(() => null);
      }
      setToken(null);
      setUser(null);
    },
  }), [error, isLoading, token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is missing.");
  return context;
}
