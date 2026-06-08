"use client";

// ============================================================
// Step 6 — Distributions & Capital Calls
// DistributionSettlement + CapitalCallManager init parameters.
// ============================================================

import { AddressField, NumberField, SectionTitle } from "./fields";

export function StepDistribution() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <SectionTitle title="Distributions" />
        <AddressField
          name="calculator"
          label="Calculator"
          required
          description="CALCULATOR address authorised to compute distribution amounts."
        />
      </div>

      <div className="space-y-4">
        <SectionTitle title="Capital Calls" />
        <NumberField
          name="executionGracePeriod"
          label="Execution Grace Period"
          required
          suffix="seconds"
          description="Window investors have to fund a capital call before enforcement (e.g. 86400 = 1 day)."
        />
      </div>
    </div>
  );
}
