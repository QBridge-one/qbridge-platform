"use client";

// ============================================================
// app/workspace/assets/new/page.tsx
//
// createDeal wizard — one react-hook-form across 7 steps, validated
// per-step via form.trigger(STEP_FIELDS[step]). The final step builds
// the DealConfig and deploys through useCreateDeal. Real-estate vertical;
// the shell is reusable for a future stablecoin factory.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, ArrowRight } from "lucide-react";

import { WizardStepper } from "./_components/wizard-stepper";
import { StepAssetToken } from "./_components/step-asset-token";
import { StepRoles } from "./_components/step-roles";
import { StepClasses } from "./_components/step-classes";
import { StepValuation } from "./_components/step-valuation";
import { StepCompliance } from "./_components/step-compliance";
import { StepDistribution } from "./_components/step-distribution";
import { StepReview } from "./_components/step-review";
import { AutofillButton } from "./_components/autofill";

import { dealWizardSchema, STEP_FIELDS, type DealWizardValues } from "@/lib/validators/deal-wizard";
import { DEAL_CATEGORY } from "@/types/deal";
import { ZERO_BYTES32, randomBytes32 } from "@/lib/contracts/factory-payload";

const LAST_STEP = 7;

const STEP_TITLES: Record<number, string> = {
  1: "Asset & Token",
  2: "Roles & Treasury",
  3: "Share Classes & Caps",
  4: "Valuation (NAV)",
  5: "Compliance",
  6: "Distributions & Capital Calls",
  7: "Review & Deploy",
};

const DEFAULT_VALUES: DealWizardValues = {
  name: "",
  symbol: "",
  decimals: "18",
  description: "",
  dealMetadataURI: "",
  category: DEAL_CATEGORY,
  assetType: "COMMERCIAL",
  salt: ZERO_BYTES32,
  dealAdmin: "",
  platformProposer: "",
  issuerExecutor: "",
  treasury: "",
  spvLegalEntity: "",
  timelockMinDelay: "0",
  globalMintCap: "",
  unitPriceAtIssuance: "",
  classes: [
    {
      shareClass: 1,
      classMintCap: "",
      subscribable: true,
      managerMintOnly: false,
      holdPeriodDays: "0",
      subTiers: [],
    },
  ],
  combinedCapEnabled: false,
  combinedCap: "0",
  combinedCapClasses: [],
  maxNavChangeBps: "1000",
  stalenessWarningSeconds: "86400",
  navPerUnitCents: "",
  asOfTimestamp: "",
  reportURI: "",
  reportURIHash: "",
  methodologyNote: "",
  accreditationValidity: "31536000",
  holdPeriodClassA: "0",
  holdPeriodClassAA: "0",
  calculator: "",
  executionGracePeriod: "86400",
};

export default function NewDealPage() {
  const [step, setStep] = useState(1);
  const form = useForm<DealWizardValues>({
    resolver: zodResolver(dealWizardSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  // Seed client-only defaults (avoids SSR hydration mismatch).
  useEffect(() => {
    if (form.getValues("salt") === ZERO_BYTES32) {
      form.setValue("salt", randomBytes32());
    }
    if (!form.getValues("asOfTimestamp")) {
      // 1h in the past: the NAV oracle rejects asOf > block.timestamp, and
      // chain time lags wall-clock — "exactly now" reads as the future.
      form.setValue("asOfTimestamp", String(Math.floor(Date.now() / 1000) - 3600));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onNext = async () => {
    const fields = STEP_FIELDS[step];
    const ok = fields ? await form.trigger(fields) : true;
    if (ok) goTo(Math.min(step + 1, LAST_STEP));
  };

  return (
    <div className="min-h-full bg-muted/30">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Create New Deal</h1>
              <Badge variant="outline" className="text-[10px]">
                {STEP_TITLES[step]}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Deploy a real-estate deal cluster on-chain via the factory.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workspace/assets">
              <X className="h-4 w-4" />
              <span className="sr-only">Cancel</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="border-b bg-card px-6 py-5">
        <div className="mx-auto max-w-3xl">
          <WizardStepper currentStep={step} />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              {process.env.NODE_ENV !== "production" && step < LAST_STEP && (
                <div className="mb-3 flex justify-end">
                  <AutofillButton step={step} />
                </div>
              )}
              <Card className="shadow-sm">
                <CardContent className="p-6 sm:p-8">
                  {step === 1 && <StepAssetToken />}
                  {step === 2 && <StepRoles />}
                  {step === 3 && <StepClasses />}
                  {step === 4 && <StepValuation />}
                  {step === 5 && <StepCompliance />}
                  {step === 6 && <StepDistribution />}
                  {step === 7 && <StepReview />}
                </CardContent>
              </Card>

              {/* Footer nav */}
              <div className="mt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goTo(Math.max(step - 1, 1))}
                  disabled={step === 1}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {step < LAST_STEP && (
                  <Button type="button" size="lg" onClick={onNext}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
