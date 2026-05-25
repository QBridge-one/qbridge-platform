"use client";

// ============================================================
// components/workspace/PersonaVerification.tsx
// Embedded Persona inquiry widget for KYB verification (step 2).
//
// Calls POST /api/onboarding/kyb-verification/start to create or
// resume an inquiry, then opens the Persona Client with the
// returned inquiryId + sessionToken. The widget runs inside an
// overlay managed by Persona's SDK — we don't host the iframe
// ourselves.
//
// Lifecycle:
//   - onComplete → user finished all steps → webhook will fire
//   - onCancel → user closed early → can resume later
//   - onError → SDK error → show a retry button
//
// After completion, the webhook handler at /api/webhooks/persona
// updates the org's kybCase; the stepper reads kybCase.status on
// the next server render (router.refresh or page navigation).
// ============================================================

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { KybCase } from "@/lib/core/kyb-verification";

interface Props {
  orgId: string;
  existingCase: KybCase | null;
}

export function PersonaVerification({ orgId, existingCase }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "loading" | "open" | "completed" | "cancelled" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const alreadyDone = existingCase?.status === "approved";
  const alreadyDeclined = existingCase?.status === "declined";

  const startVerification = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/onboarding/kyb-verification/start", {
        method: "POST",
      });
      const data = (await res.json()) as {
        inquiryId?: string;
        sessionToken?: string;
        alreadyComplete?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not start verification.");
        setStatus("error");
        return;
      }
      if (data.alreadyComplete) {
        setStatus("completed");
        router.refresh();
        return;
      }
      if (!data.inquiryId || !data.sessionToken) {
        setError("Missing inquiry credentials from server.");
        setStatus("error");
        return;
      }

      // Dynamically import the Persona SDK (client-side only, avoids
      // SSR issues since it touches the DOM).
      const Persona = (await import("persona")).default;
      setStatus("open");
      const client = new Persona.Client({
        inquiryId: data.inquiryId,
        sessionToken: data.sessionToken,
        onComplete: () => {
          setStatus("completed");
          router.refresh();
        },
        onCancel: () => {
          setStatus("cancelled");
        },
        onError: (err: unknown) => {
          const msg =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: unknown }).message)
              : "Verification encountered an error.";
          setError(msg);
          setStatus("error");
        },
      });
      client.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setStatus("error");
    }
  }, [router]);

  if (alreadyDone) {
    return (
      <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
        Identity verification complete. No further action needed.
      </div>
    );
  }

  if (alreadyDeclined) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Your verification was declined by our compliance partner. Please contact QBridge support
          or try again with updated documents.
        </div>
        <Button onClick={startVerification} disabled={status === "loading"}>
          {status === "loading" ? "Starting…" : "Retry verification"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {status === "completed" ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
          Verification submitted successfully. We'll notify you once the review is complete.
        </div>
      ) : status === "cancelled" ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
          Verification paused. You can resume anytime.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button
        onClick={startVerification}
        disabled={status === "loading" || status === "open"}
      >
        {status === "loading"
          ? "Starting…"
          : status === "open"
            ? "Verification in progress…"
            : existingCase
              ? "Resume verification"
              : "Start verification"}
      </Button>
    </div>
  );
}
