"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import type { WorkspaceAccess } from "@/lib/vault-types";

export function useWorkspaceAccess(workspace: WorkspaceAccess) {
  const { status } = useAuth();
  const [access, setAccess] = useState<{ allowed: boolean; loading: boolean }>({ allowed: false, loading: true });

  useEffect(() => {
    if (status !== "authenticated") {
      setAccess({ allowed: false, loading: status === "loading" });
      return;
    }

    let active = true;
    setAccess((current) => ({ ...current, loading: true }));
    fetch("/api/auth/workspace-access", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error ?? "Workspace access could not be checked.");
        return Array.isArray(result?.workspaceAccess) && result.workspaceAccess.includes(workspace);
      })
      .then((allowed) => {
        if (active) setAccess({ allowed, loading: false });
      })
      .catch(() => {
        if (active) setAccess({ allowed: false, loading: false });
      });

    return () => {
      active = false;
    };
  }, [status, workspace]);

  return access;
}
