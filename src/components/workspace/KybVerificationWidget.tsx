"use client";

// ============================================================
// components/workspace/KybVerificationWidget.tsx
// Provider-agnostic KYB verification launcher (onboarding step 2).
//
// Calls POST /api/onboarding/kyb-verification/start, which routes
// to Persona or Sumsub (jurisdiction-aware) and returns the
// provider + credentials. This component then renders the matching
// widget:
//   - persona → imperative modal via the `persona` SDK
//   - sumsub  → inline <SumsubWebSdk> React component
//
// Authoritative status always comes from the provider webhook
// (/api/webhooks/{persona,sumsub}); the client callbacks just
// drive optimistic UI + router.refresh().
// ============================================================

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import type { KybCase, VerificationProvider } from "@/lib/core/kyb-verification";

// Sumsub SDK is a client-only React component — load lazily so it
// never lands in the server bundle.
const SumsubWebSdk = dynamic(() => import("@sumsub/websdk-react"), {
  ssr: false,
});

interface Props {
  orgId: string;
  existingCase: KybCase | null;
}

interface StartResponse {
  provider?: VerificationProvider;
  caseId?: string;
  sessionToken?: string;
  alreadyComplete?: boolean;
  error?: string;
}

type Phase =
  | "idle"
  | "loading"
  | "persona_open"
  | "sumsub_open"
  | "completed"
  | "cancelled"
  | "error";

export function KybVerificationWidget({ orgId, existingCase }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sumsubToken, setSumsubToken] = useState<string | null>(null);

  const alreadyDone = existingCase?.status === "approved";
  const alreadyDeclined = existingCase?.status === "declined";

  /** Hit the start endpoint; returns the parsed response or null on error. */
  const requestStart = useCallback(async (): Promise<StartResponse | null> => {
    const res = await fetch("/api/onboarding/kyb-verification/start", {
      method: "POST",
    });
    const data = (await res.json()) as StartResponse;
    if (!res.ok) {
      setError(data.error ?? "Could not start verification.");
      setPhase("error");
      return null;
    }
    return data;
  }, []);

  const start = useCallback(async () => {
    setPhase("loading");
    setError(null);
    const data = await requestStart();
    if (!data) return;

    if (data.alreadyComplete) {
      setPhase("completed");
      router.refresh();
      return;
    }
    if (!data.provider || !data.sessionToken) {
      setError("Missing verification credentials from server.");
      setPhase("error");
      return;
    }

    if (data.provider === "sumsub") {
      setSumsubToken(data.sessionToken);
      setPhase("sumsub_open");
      return;
    }

    // Persona — imperative modal.
    if (!data.caseId) {
      setError("Missing inquiry id from server.");
      setPhase("error");
      return;
    }
    try {
      const Persona = (await import("persona")).default;
      setPhase("persona_open");
      const client = new Persona.Client({
        inquiryId: data.caseId,
        sessionToken: data.sessionToken,
        onComplete: () => {
          setPhase("completed");
          router.refresh();
        },
        onCancel: () => setPhase("cancelled"),
        onError: (err: unknown) => {
          setError(
            err && typeof err === "object" && "message" in err
              ? String((err as { message: unknown }).message)
              : "Verification encountered an error.",
          );
          setPhase("error");
        },
      });
      client.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setPhase("error");
    }
  }, [requestStart, router]);

  // ── Terminal states ───────────────────────────────────────
  if (alreadyDone) {
    return (
      <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
        Identity verification complete. No further action needed.
      </div>
    );
  }

  if (alreadyDeclined && phase === "idle") {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Your verification was declined by our compliance partner. Please contact QBridge support
          or try again with updated documents.
        </div>
        <Button onClick={start}>Retry verification</Button>
      </div>
    );
  }

  // ── Sumsub inline widget ──────────────────────────────────
  if (phase === "sumsub_open" && sumsubToken) {
    return (
      <div className="rounded-lg border bg-background p-2">
        <SumsubWebSdk
          accessToken={sumsubToken}
          expirationHandler={async () => {
            const data = await requestStart();
            return data?.sessionToken ?? "";
          }}
          config={{ lang: "en" }}
          options={{ addViewportTag: false, adaptIframeHeight: true }}
          onMessage={(type: string) => {
            // Submission is signalled via idCheck.onApplicantSubmitted;
            // the webhook delivers the authoritative decision.
            if (
              type === "idCheck.onApplicantSubmitted" ||
              type === "idCheck.applicantStatus"
            ) {
              setPhase("completed");
              router.refresh();
            }
          }}
          onError={(err: unknown) => {
            setError(
              err && typeof err === "object" && "error" in err
                ? String((err as { error: unknown }).error)
                : "Verification encountered an error.",
            );
            setPhase("error");
          }}
        />
      </div>
    );
  }

  // ── Status messages + launch button ───────────────────────
  return (
    <div className="space-y-3">
      {phase === "completed" ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
          Verification submitted successfully. We'll notify you once the review is complete.
        </div>
      ) : phase === "cancelled" ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
          Verification paused. You can resume anytime.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {phase !== "completed" ? (
        <Button onClick={start} disabled={phase === "loading" || phase === "persona_open"}>
          {phase === "loading"
            ? "Starting…"
            : phase === "persona_open"
              ? "Verification in progress…"
              : existingCase
                ? "Resume verification"
                : "Start verification"}
        </Button>
      ) : null}
    </div>
  );
}
