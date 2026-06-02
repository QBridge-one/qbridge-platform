"use client";

// ============================================================
// components/ops/KybTierToggle.tsx
// Ops UI for runtime-toggling the active Sumsub KYB tier.
// Reads via GET /api/ops/settings/kyb-tier, writes via POST.
// ============================================================

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type Tier = "basic" | "full";
type Source = "db" | "env" | "default";

interface Props {
  initialTier: Tier;
  initialSource: Source;
}

const TIER_LABEL: Record<Tier, string> = {
  basic: "Basic",
  full: "Full",
};

const TIER_DESC: Record<Tier, string> = {
  basic:
    "Light verification — entity name, registration number, sanctions screening. Can auto-approve.",
  full:
    "Deep verification — adds beneficial owners, enhanced due diligence, manual reviewer step.",
};

const SOURCE_LABEL: Record<Source, string> = {
  db: "Override active",
  env: "Using env default",
  default: "Using built-in default",
};

export function KybTierToggle({ initialTier, initialSource }: Props) {
  const router = useRouter();
  const [tier, setTier] = useState<Tier>(initialTier);
  const [source, setSource] = useState<Source>(initialSource);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = useCallback(
    async (next: Tier) => {
      if (next === tier) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/ops/settings/kyb-tier", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tier: next }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          tier?: Tier;
          error?: string;
        };
        if (!res.ok) {
          setError(data.error ?? "Could not save.");
          return;
        }
        setTier(data.tier ?? next);
        setSource("db");
        router.refresh();
      } finally {
        setBusy(false);
      }
    },
    [tier, router],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Active tier: <span className="font-semibold text-foreground">{TIER_LABEL[tier]}</span>
        </p>
        <Badge variant="outline" className="text-xs">
          {SOURCE_LABEL[source]}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["basic", "full"] as Tier[]).map((t) => {
          const isActive = t === tier;
          return (
            <button
              key={t}
              type="button"
              onClick={() => choose(t)}
              disabled={busy}
              className={`group flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition disabled:opacity-50 ${
                isActive
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/40 hover:bg-accent/40"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-medium">{TIER_LABEL[t]}</span>
                {isActive ? (
                  <Badge variant="outline" className="text-xs">
                    Selected
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {TIER_DESC[t]}
              </p>
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Changes take effect on the next "Start verification" call. Already-running
        Sumsub applicants keep the level they were created with.
      </p>
    </div>
  );
}
