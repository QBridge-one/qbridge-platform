"use client";

// ============================================================
// app/onboarding/kyb/kyb-form.tsx — Client form → POST /api/onboarding/kyb
// ============================================================

import type { IssuerKybStatus } from "@/lib/core/issuer-kyb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orgName: string;
  initialStatus: IssuerKybStatus | null;
};

export function KybForm({ orgName, initialStatus }: Props) {
  const router = useRouter();
  const [legalEntityName, setLegalEntityName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showRejected = initialStatus === "rejected";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/onboarding/kyb", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          legalEntityName: legalEntityName.trim(),
          jurisdiction: jurisdiction.trim(),
          companyWebsite: companyWebsite.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not submit.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
      {showRejected ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          Your previous submission was not approved. Update the details below and submit again.
        </p>
      ) : null}

      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          Workspace: <span className="font-medium text-foreground">{orgName}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="legalEntityName">Legal entity name</Label>
          <Input
            id="legalEntityName"
            required
            autoComplete="organization"
            value={legalEntityName}
            onChange={(e) => setLegalEntityName(e.target.value)}
            placeholder="Registered legal name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jurisdiction">Primary jurisdiction</Label>
          <Input
            id="jurisdiction"
            required
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            placeholder="e.g. Cayman Islands / Canada / UAE"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyWebsite">Company website (optional)</Label>
          <Input
            id="companyWebsite"
            type="url"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes for compliance (optional)</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Regulator, offering type, timeline…"
          />
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Submitting…" : "Submit for review"}
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        Please ensure these details match your incorporation records — verification continues out of band with QBridge
        onboarding.
      </p>
    </form>
  );
}
