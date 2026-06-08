"use client";

// ============================================================
// Step 5 — Compliance
// RealEstateComplianceChecker init parameters.
// ============================================================

import { NumberField, SectionTitle } from "./fields";

export function StepCompliance() {
  return (
    <div className="space-y-8">
      <SectionTitle
        title="Compliance Rules"
        hint="Accreditation validity and per-class hold periods, in seconds."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NumberField
          name="accreditationValidity"
          label="Accreditation Validity"
          required
          suffix="seconds"
          description="How long an investor's accreditation stays valid (e.g. 31536000 = 1 year)."
        />
        <NumberField
          name="holdPeriodClassA"
          label="Hold Period — Class A"
          required
          suffix="seconds"
          description="Transfer lock-up for Class A."
        />
        <NumberField
          name="holdPeriodClassAA"
          label="Hold Period — Class AA"
          required
          suffix="seconds"
          description="Transfer lock-up for Class AA."
        />
      </div>
    </div>
  );
}
