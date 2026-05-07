"use client";

// ============================================================
// lib/hooks/useSession.ts
// Reads the current session (vendor-agnostic shape) from /api/session.
// Use in client components to gate UI.
// ============================================================

import { useEffect, useState } from "react";
import type { AppSession } from "../core/identity.types";

interface SessionState {
  session: AppSession | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSession(): SessionState {
  const [session, setSession] = useState<AppSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/session", { cache: "no-store" });
      if (r.status === 401) {
        setSession(null);
        return;
      }
      if (!r.ok) {
        setError(`Session fetch failed (${r.status})`);
        setSession(null);
        return;
      }
      const d = (await r.json()) as { session: AppSession };
      setSession(d.session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Session fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { session, loading, error, refresh };
}
