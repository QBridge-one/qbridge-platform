"use client";

// ============================================================
// Client picker for the asset-class onboarding step. Single-select: pick one
// enabled asset class → POST /api/onboarding/asset-class → continue to KYB.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

interface Option {
  key: string;
  label: string;
  tagline: string;
}

export function AssetClassPicker({
  options,
  preselected,
  orgName,
}: {
  options: Option[];
  preselected: string;
  orgName?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(preselected);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/asset-class", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product: selected }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Couldn't save your choice. Please try again.");
      }
      router.push("/onboarding/kyb");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  if (options.length === 0) {
    return (
      <section className="rounded-lg border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        No asset classes are enabled for this environment. Contact your QBridge administrator.
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
      {orgName ? (
        <p className="text-xs text-muted-foreground">
          Workspace: <span className="font-medium text-foreground">{orgName}</span>
        </p>
      ) : null}

      <div className="space-y-3" role="radiogroup" aria-label="Asset class">
        {options.map((o) => {
          const active = selected === o.key;
          return (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(o.key)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                active
                  ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary))_inset]"
                  : "hover:border-muted-foreground/40",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                )}
              >
                {active ? <Check className="h-3 w-3" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{o.tagline}</span>
              </span>
            </button>
          );
        })}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button className="w-full" onClick={submit} disabled={busy || !selected}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Continue
      </Button>
    </section>
  );
}
