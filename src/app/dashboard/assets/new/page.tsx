"use client";

// ============================================================
// app/dashboard/assets/new/page.tsx
// Asset creation wizard — orchestrates all 5 steps
// State persisted in component (extend with localStorage/DB draft saving)
// ============================================================

import { useState } from "react";
import { WizardStepper } from "./_components/wizard-stepper";
import { StepAssetDetails } from "./_components/step-asset-details";
import { StepTokenConfig } from "./_components/step-token-config";
import { StepDocuments } from "./_components/step-documents";
import { StepCompliance } from "./_components/step-compliance";
import { StepReview } from "./_components/step-review";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import Link from "next/link";
import type {
  AssetWizardState,
  AssetDetailsFormData,
  TokenConfigFormData,
  DocumentsFormData,
  ComplianceFormData,
} from "@/types/assets";

// ─── Initial empty state ──────────────────────────────────────
const INITIAL_STATE: AssetWizardState = {
  step: 1,
  assetDetails: {},
  tokenConfig: {},
  documents: {},
  compliance: {},
};

const STEP_TITLES: Record<number, string> = {
  1: "Asset Details",
  2: "Token Configuration",
  3: "Legal Documents",
  4: "Compliance Rules",
  5: "Review & Submit",
};

// ─── Page ─────────────────────────────────────────────────────
export default function NewAssetPage() {
  const [state, setState] = useState<AssetWizardState>(INITIAL_STATE);

  // ── Step navigation ──
  const goTo = (step: AssetWizardState["step"]) => {
    setState((prev) => ({ ...prev, step }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Step handlers ──
  const handleStep1 = (data: AssetDetailsFormData) => {
    setState((prev) => ({ ...prev, assetDetails: data }));
    goTo(2);
  };

  const handleStep2 = (data: TokenConfigFormData) => {
    setState((prev) => ({ ...prev, tokenConfig: data }));
    goTo(3);
  };

  const handleStep3 = (data: DocumentsFormData) => {
    setState((prev) => ({ ...prev, documents: data }));
    goTo(4);
  };

  const handleStep4 = (data: ComplianceFormData) => {
    setState((prev) => ({ ...prev, compliance: data }));
    goTo(5);
  };

  const handleSubmit = async () => {
    // TODO: POST to /api/assets with state
    // The API route should:
    //   1. Validate all fields server-side
    //   2. Store asset as PENDING_REVIEW in your DB
    //   3. Notify platform compliance team
    //   4. Return asset ID
    await new Promise((resolve) => setTimeout(resolve, 2000)); // simulate API
    console.log("Submitting asset:", state);
  };

  const handleSaveDraft = () => {
    // TODO: save to DB or localStorage
    console.log("Saving draft:", state);
  };

  return (
    <div className="min-h-full bg-muted/30">
      {/* ── Page header ── */}
      <div className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">Create New Asset</h1>
                <Badge variant="outline" className="text-[10px]">
                  {STEP_TITLES[state.step]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tokenize a real-world asset on the QBridge launchpad.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="hidden sm:flex"
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save Draft
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/assets">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cancel</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stepper ── */}
      <div className="border-b bg-card px-6 py-5">
        <div className="mx-auto max-w-3xl">
          <WizardStepper currentStep={state.step} />
        </div>
      </div>

      {/* ── Step content ── */}
      <div className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <Card className="shadow-sm">
            <CardContent className="p-6 sm:p-8">
              {state.step === 1 && (
                <StepAssetDetails
                  defaultValues={state.assetDetails}
                  onNext={handleStep1}
                />
              )}

              {state.step === 2 && (
                <StepTokenConfig
                  defaultValues={state.tokenConfig}
                  onNext={handleStep2}
                  onBack={() => goTo(1)}
                />
              )}

              {state.step === 3 && (
                <StepDocuments
                  defaultValues={state.documents}
                  onNext={handleStep3}
                  onBack={() => goTo(2)}
                />
              )}

              {state.step === 4 && (
                <StepCompliance
                  defaultValues={state.compliance}
                  onNext={handleStep4}
                  onBack={() => goTo(3)}
                />
              )}

              {state.step === 5 && (
                <StepReview
                  state={state}
                  onBack={() => goTo(4)}
                  onSubmit={handleSubmit}
                />
              )}
            </CardContent>
          </Card>

          {/* ── Step footer hint ── */}
          {state.step < 5 && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Step {state.step} of 5 · Your progress is saved automatically.
              You can close and return to this draft.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
