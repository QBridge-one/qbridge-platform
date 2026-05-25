"use client";

// ============================================================
// useIssuerRegistrationContext
// Client fetch for GET /api/ops/issuers/:orgId/registration-context.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import type { IssuerRegistrationContext } from "@/lib/contracts/issuer-registry-payload";

export function useIssuerRegistrationContext(orgId: string | null) {
  const [data, setData] = useState<IssuerRegistrationContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/ops/issuers/${encodeURIComponent(orgId)}/registration-context`,
        { credentials: "include" },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Failed to load registration context (${res.status})`);
      }
      const json = (await res.json()) as IssuerRegistrationContext;
      setData(json);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err : new Error("Failed to load registration context"));
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
