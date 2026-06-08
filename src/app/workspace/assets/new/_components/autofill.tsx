"use client";

// ============================================================
// Dev-only autofill for the createDeal wizard.
//
// stepSample(step) returns randomised-but-valid values for just that
// step's fields; <AutofillButton> applies them to the current step.
// Rendered only outside production (see page.tsx) — a testing aid, not
// a product feature.
// ============================================================

import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { useWallet } from "@/lib/hooks/useWallet";
import { randomBytes32 } from "@/lib/contracts/factory-payload";
import type { DealWizardValues } from "@/lib/validators/deal-wizard";

// ─── tiny random helpers ──────────────────────────────────────
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const rand36 = () => Math.random().toString(36).slice(2, 12);

/** Whole-token count → base units (×10¹⁸) as a string. */
const e18 = (n: number) => (BigInt(n) * BigInt("1000000000000000000")).toString();

function randAddress(): `0x${string}` {
  const b = new Uint8Array(20);
  crypto.getRandomValues(b);
  return `0x${Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")}`;
}

const NAMES = ["Trinnium SA1", "Aurora Tower", "Harborpoint", "Maple Civic", "Northgate Logistics", "Riverside Commons"];
const SUFFIXES = ["LLC", "SPV", "Trust", "Holdings"];
const ASSET_TYPES = ["COMMERCIAL", "RESIDENTIAL", "INDUSTRIAL", "MIXED_USE", "LAND"] as const;
const TIER_LABELS = ["Seed", "Anchor", "Founder", "Early"];
const METHODOLOGY = [
  "Independent third-party appraisal, income approach.",
  "Discounted cash-flow valuation by external auditor.",
  "Comparable-sales appraisal, certified valuer.",
];

function symbolFrom(name: string): string {
  const letters = name.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 4) || "DEAL";
  return `${letters}${randInt(1, 99)}`.slice(0, 12);
}

/** Random valid values for the fields owned by a given wizard step. */
export function stepSample(step: number, wallet: string | null): Partial<DealWizardValues> {
  const addr = (wallet as `0x${string}` | null) ?? randAddress();

  switch (step) {
    case 1: {
      const name = `${pick(NAMES)} ${pick(SUFFIXES)} ${randInt(1, 99)}`;
      return {
        name,
        symbol: symbolFrom(name),
        decimals: "18",
        description:
          "Tokenized commercial real-estate SPV holding income-producing property; holders receive fractional economic interest.",
        dealMetadataURI: `ipfs://bafkrei${rand36()}`,
        category: "REAL_ESTATE",
        assetType: pick(ASSET_TYPES),
        salt: randomBytes32(),
      };
    }
    case 2:
      return {
        dealAdmin: addr,
        platformProposer: addr,
        issuerExecutor: addr,
        treasury: addr,
        spvLegalEntity: addr,
        timelockMinDelay: pick(["0", "3600", "86400"]),
      };
    case 3: {
      const globalH = pick([1_000_000, 5_000_000, 10_000_000]);
      const aH = Math.floor(globalH * 0.6);
      const bH = globalH - aH;
      const split = randInt(3000, 7000);
      return {
        globalMintCap: e18(globalH),
        unitPriceAtIssuance: String(randInt(50, 500) * 100),
        classes: [
          {
            shareClass: 1, // Class A
            classMintCap: e18(aH),
            subscribable: true,
            managerMintOnly: false,
            holdPeriodDays: String(pick([90, 180, 365])),
            subTiers: [
              {
                tierId: "1",
                label: pick(TIER_LABELS),
                minimumCommitment: String(randInt(10, 100) * 1000 * 100), // $10k–$100k in cents
                classSplitBps: String(split),
                classBSplitBps: String(10000 - split),
              },
            ],
          },
          {
            // Class B = manager carry/promote: not subscribable, manager-mint-only, no sub-tiers
            shareClass: 3,
            classMintCap: e18(bH),
            subscribable: false,
            managerMintOnly: true,
            holdPeriodDays: "0",
            subTiers: [],
          },
        ],
        combinedCapEnabled: true,
        combinedCap: e18(globalH),
        combinedCapClasses: [1, 3], // Class A + Class B
      };
    }
    case 4:
      return {
        maxNavChangeBps: pick(["500", "1000", "2000"]),
        stalenessWarningSeconds: pick(["86400", "172800"]),
        navPerUnitCents: String(randInt(50, 500) * 100),
        // 1h in the past — oracle rejects asOf > block.timestamp (chain lag).
        asOfTimestamp: String(Math.floor(Date.now() / 1000) - 3600),
        reportURI: `ipfs://bafkrei${rand36()}`,
        reportURIHash: "",
        methodologyNote: pick(METHODOLOGY),
      };
    case 5:
      return {
        accreditationValidity: "31536000",
        holdPeriodClassA: pick(["15552000", "31536000"]),
        holdPeriodClassAA: pick(["7776000", "15552000"]),
      };
    case 6:
      return {
        calculator: addr,
        executionGracePeriod: pick(["259200", "604800"]),
      };
    default:
      return {};
  }
}

/** Fills the current step's fields with sample data. Dev aid. */
export function AutofillButton({ step }: { step: number }) {
  const form = useFormContext<DealWizardValues>();
  const { address } = useWallet();

  const onClick = () => {
    const sample = stepSample(step, address);
    (Object.entries(sample) as [keyof DealWizardValues, never][]).forEach(([key, value]) =>
      form.setValue(key, value, { shouldValidate: true, shouldDirty: true }),
    );
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} title="Fill this step with sample data">
      <Wand2 className="mr-1.5 h-3.5 w-3.5" />
      Autofill step
    </Button>
  );
}
