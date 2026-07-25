"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import type { BodyCompositionPayload } from "@/lib/body-composition";

export function useBodyData(params = "") {
  const { session } = useAuth();
  const [data, setData] = useState<BodyCompositionPayload | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!session?.access_token) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/body-composition${params}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Body composition data could not be loaded.");
      setData(result as BodyCompositionPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Body composition data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [params, session?.access_token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, isLoading, reload, token: session?.access_token ?? "" };
}
