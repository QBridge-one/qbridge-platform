"use client";

// ============================================================
// Step 4 — Valuation (NAV oracle)
// ManagerAttestedValuationOracle init + initial attestation.
// ============================================================

import { NumberField, TextField, TextAreaField, SectionTitle } from "./fields";

export function StepValuation() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <SectionTitle title="Oracle Settings" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            name="maxNavChangeBps"
            label="Max NAV Change"
            required
            suffix="bps"
            description="Largest allowed NAV move per attestation (10000 = 100%)."
          />
          <NumberField
            name="stalenessWarningSeconds"
            label="Staleness Warning"
            required
            suffix="seconds"
            description="Age after which NAV is flagged stale (e.g. 86400 = 1 day)."
          />
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle title="Initial Attestation" hint="Seeds the oracle with the opening valuation." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            name="navPerUnitCents"
            label="NAV per Unit"
            required
            suffix="cents"
            description="Opening NAV per token unit, in cents."
          />
          <NumberField
            name="asOfTimestamp"
            label="As-of Timestamp"
            required
            suffix="unix"
            description="Valuation date as a unix timestamp (seconds). Must be at or before current chain time — not in the future."
          />
        </div>
        <TextField
          name="reportURI"
          label="Report URI"
          placeholder="ipfs://… or https://… (optional)"
          description="Link to the valuation report. reportURIHash defaults to keccak256(URI)."
        />
        <TextField
          name="reportURIHash"
          label="Report URI Hash (advanced)"
          mono
          placeholder="0x… (optional — leave blank to derive from URI)"
        />
        <TextAreaField
          name="methodologyNote"
          label="Methodology Note"
          placeholder="Brief note on the valuation methodology (optional)."
        />
      </div>
    </div>
  );
}
