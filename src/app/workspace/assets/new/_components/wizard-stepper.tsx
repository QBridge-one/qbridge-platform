"use client";

// ============================================================
// app/workspace/assets/new/_components/wizard-stepper.tsx
// Step indicator for the asset creation wizard
// ============================================================

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  number: number;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { number: 1, label: "Asset & Token", description: "Name, symbol, classification" },
  { number: 2, label: "Roles", description: "Admins, treasury, timelock" },
  { number: 3, label: "Share Classes", description: "Classes, sub-tiers, caps" },
  { number: 4, label: "Valuation", description: "NAV oracle & attestation" },
  { number: 5, label: "Compliance", description: "Accreditation, hold periods" },
  { number: 6, label: "Distributions", description: "Calculator, capital calls" },
  { number: 7, label: "Review", description: "Review & deploy" },
];

interface WizardStepperProps {
  currentStep: number; // 1-7
  /** When true, every step renders complete (post-deploy). */
  completed?: boolean;
}

export function WizardStepper({ currentStep, completed = false }: WizardStepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      {/* Desktop: horizontal stepper */}
      <ol className="hidden sm:flex items-center w-full">
        {STEPS.map((step, index) => {
          const isComplete = completed || currentStep > step.number;
          const isCurrent = !completed && currentStep === step.number;
          const isUpcoming = !completed && currentStep < step.number;
          const isLast = index === STEPS.length - 1;

          return (
            <li
              key={step.number}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              <div className="flex flex-col items-center gap-1.5">
                {/* Circle */}
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200",
                    isComplete &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-background text-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]",
                    isUpcoming &&
                      "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                {/* Labels */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-xs font-medium whitespace-nowrap",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-px mx-3 transition-colors duration-200 -mt-5",
                    isComplete ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: compact step indicator */}
      <div className="flex sm:hidden items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            Step {currentStep} of {STEPS.length}
          </p>
          <p className="text-xs text-muted-foreground">
            {STEPS[currentStep - 1]?.label} —{" "}
            {STEPS[currentStep - 1]?.description}
          </p>
        </div>
        <div className="flex gap-1">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                currentStep > step.number
                  ? "w-4 bg-primary"
                  : currentStep === step.number
                  ? "w-4 bg-primary"
                  : "w-1.5 bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

export { STEPS };
