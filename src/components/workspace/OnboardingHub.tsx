// ============================================================
// components/workspace/OnboardingHub.tsx
// Issuer-side stepper showing where the workspace is in the broader
// onboarding journey. Server component — purely visual, no client
// state. Status for step 1 comes from the AppOrg passed in by the
// page; later steps are placeholders today (KYB via Sumsub, etc.)
// and will become real state machines as they ship.
// ============================================================

import Link from "next/link";
import { CheckCircle2, Circle, Clock, AlertTriangle, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AppOrg } from "@/lib/core/identity.types";
import { KybVerificationWidget } from "./KybVerificationWidget";

type StepState =
  | { kind: "done"; subtitle: string }
  | { kind: "in_progress"; subtitle: string }
  | { kind: "action_required"; subtitle: string }
  | { kind: "available"; subtitle: string }
  | { kind: "coming_soon"; subtitle: string }
  | { kind: "locked"; subtitle: string };

interface Step {
  number: number;
  title: string;
  description: string;
  state: StepState;
  cta?: { label: string; href: string; variant?: "default" | "outline" };
  customContent?: React.ReactNode;
}

export function OnboardingHub({ org }: { org: AppOrg }) {
  const steps = buildSteps(org);
  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Issuer onboarding</h1>
        <p className="text-sm text-muted-foreground">
          Track where your workspace is in the QBridge onboarding journey. Each step unlocks
          capabilities as it completes.
        </p>
      </header>

      <ol className="space-y-3">
        {steps.map((s, i) => (
          <StepCard key={s.number} step={s} isLast={i === steps.length - 1} />
        ))}
      </ol>
    </div>
  );
}

function buildSteps(org: AppOrg): Step[] {
  const application = applicationStep(org);
  return [
    application,
    kybVerificationStep(org),
    {
      number: 3,
      title: "Compliance setup",
      description:
        "Define your jurisdiction-specific rules: investor accreditation gates, transfer restrictions, lock-up periods, and reporting cadence.",
      state: stepGatingByApplication(org, {
        kind: "locked",
        subtitle: "Available after KYB verification",
      }),
    },
    {
      number: 4,
      title: "Asset registration",
      description:
        "Deploy your first token contract, configure AccessManager roles for your team, and connect your treasury wallet.",
      state: stepGatingByApplication(org, {
        kind: "locked",
        subtitle: "Available after compliance setup",
      }),
    },
  ];
}

function applicationStep(org: AppOrg): Step {
  const base = {
    number: 1,
    title: "Application",
    description:
      "Basic information about your organization — legal entity, jurisdiction, website. This is QBridge's initial review before we kick off the regulated KYB process.",
  } as const;
  switch (org.kybStatus) {
    case "approved":
      return {
        ...base,
        state: {
          kind: "done",
          subtitle: `Approved${org.kybReview ? ` on ${new Date(org.kybReview.decidedAt).toLocaleDateString()}` : ""}`,
        },
        cta: { label: "View application", href: "/onboarding/kyb", variant: "outline" },
      };
    case "submitted":
      return {
        ...base,
        state: {
          kind: "in_progress",
          subtitle: org.kybApplication
            ? `Submitted ${new Date(org.kybApplication.submittedAt).toLocaleDateString()} — awaiting review`
            : "Submitted — awaiting review",
        },
        cta: { label: "View submission", href: "/onboarding/kyb", variant: "outline" },
      };
    case "rejected":
      return {
        ...base,
        state: {
          kind: "action_required",
          subtitle: "Application was rejected — update details and resubmit",
        },
        cta: { label: "Resubmit application", href: "/onboarding/kyb" },
      };
    default:
      return {
        ...base,
        state: { kind: "available", subtitle: "Not started" },
        cta: { label: "Start application", href: "/onboarding/kyb" },
      };
  }
}

/** Steps 2-4 are gated on application approval. Until then they show
 *  as "locked" regardless of their underlying state. */
function stepGatingByApplication(org: AppOrg, defaultState: StepState): StepState {
  if (org.kybStatus !== "approved") {
    return {
      kind: "locked",
      subtitle: "Complete the issuer application first",
    };
  }
  return defaultState;
}

function kybVerificationStep(org: AppOrg): Step {
  const base = {
    number: 2,
    title: "Identity verification",
    description:
      "Beneficial owners, sanctions screening, and document verification. Processed by our compliance partner. Required before launching your first offering.",
  } as const;
  if (org.kybStatus !== "approved") {
    return {
      ...base,
      state: { kind: "locked", subtitle: "Complete the issuer application first" },
    };
  }
  const kybCase = org.kybCase;
  if (!kybCase) {
    return {
      ...base,
      state: { kind: "available", subtitle: "Ready to start" },
      customContent: <KybVerificationWidget orgId={org.id} existingCase={null} />,
    };
  }
  switch (kybCase.status) {
    case "approved":
      return {
        ...base,
        state: {
          kind: "done",
          subtitle: `Verified on ${new Date(kybCase.updatedAt).toLocaleDateString()}`,
        },
      };
    case "declined":
    case "failed":
      return {
        ...base,
        state: {
          kind: "action_required",
          subtitle: "Verification was not successful — retry with updated documents",
        },
        customContent: <KybVerificationWidget orgId={org.id} existingCase={kybCase} />,
      };
    case "expired":
      return {
        ...base,
        state: { kind: "action_required", subtitle: "Verification expired — please restart" },
        customContent: <KybVerificationWidget orgId={org.id} existingCase={kybCase} />,
      };
    default:
      return {
        ...base,
        state: {
          kind: "in_progress",
          subtitle: kybCase.status === "needs_review"
            ? "Under manual review by our compliance partner"
            : "Verification in progress",
        },
        customContent: <KybVerificationWidget orgId={org.id} existingCase={kybCase} />,
      };
  }
}

function StepCard({ step, isLast }: { step: Step; isLast: boolean }) {
  const { Icon, ringClass, badgeClass, badgeLabel } = stateVisuals(step.state);
  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${ringClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {!isLast ? <div className="mt-2 w-px flex-1 bg-border" /> : null}
      </div>

      <div className="flex-1 rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Step {step.number}
            </p>
            <h2 className="text-lg font-semibold leading-tight">{step.title}</h2>
          </div>
          <Badge variant="outline" className={`text-xs ${badgeClass}`}>
            {badgeLabel}
          </Badge>
        </div>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {step.description}
        </p>

        <p className="mt-3 text-xs text-muted-foreground">{step.state.subtitle}</p>

        {step.cta ? (
          <div className="mt-4">
            <Button asChild size="sm" variant={step.cta.variant ?? "default"}>
              <Link href={step.cta.href}>{step.cta.label}</Link>
            </Button>
          </div>
        ) : null}

        {step.customContent ? (
          <div className="mt-4">{step.customContent}</div>
        ) : null}
      </div>
    </li>
  );
}

function stateVisuals(state: StepState): {
  Icon: typeof CheckCircle2;
  ringClass: string;
  badgeClass: string;
  badgeLabel: string;
} {
  switch (state.kind) {
    case "done":
      return {
        Icon: CheckCircle2,
        ringClass:
          "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
        badgeClass:
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
        badgeLabel: "Approved",
      };
    case "in_progress":
      return {
        Icon: Clock,
        ringClass:
          "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-300",
        badgeClass:
          "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200",
        badgeLabel: "Under review",
      };
    case "action_required":
      return {
        Icon: AlertTriangle,
        ringClass: "border-destructive/50 bg-destructive/10 text-destructive",
        badgeClass: "border-destructive/40 bg-destructive/10 text-destructive",
        badgeLabel: "Action required",
      };
    case "available":
      return {
        Icon: Circle,
        ringClass: "border-primary/50 bg-primary/5 text-primary",
        badgeClass: "border-primary/40 bg-primary/5 text-primary",
        badgeLabel: "Available",
      };
    case "coming_soon":
      return {
        Icon: Circle,
        ringClass:
          "border-muted-foreground/30 bg-muted text-muted-foreground",
        badgeClass:
          "border-muted-foreground/30 bg-muted text-muted-foreground",
        badgeLabel: "Coming soon",
      };
    case "locked":
      return {
        Icon: Lock,
        ringClass:
          "border-muted-foreground/30 bg-muted text-muted-foreground",
        badgeClass:
          "border-muted-foreground/30 bg-muted text-muted-foreground",
        badgeLabel: "Locked",
      };
  }
}
