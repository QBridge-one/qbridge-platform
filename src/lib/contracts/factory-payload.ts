// ============================================================
// lib/contracts/factory-payload.ts
//
// Deterministic mapping from wizard form values → DealConfig tuple for
// SingleSpvRealEstateFactory.createDeal. Mirrors the pattern in
// issuer-registry-payload.ts (off-chain data → on-chain args).
//
// bytes32-from-label uses keccak256(stringToBytes(...)) — the same
// convention as entityIdFromOrgId and the documented
// `dealId = keccak256(dealName)`.
// ============================================================

import { keccak256, stringToBytes } from "viem";
import type { Hex } from "../core/types";
import type { DealConfig } from "@/types/deal";
import type { DealWizardValues } from "../validators/deal-wizard";

export const ZERO_BYTES32: Hex = `0x${"0".repeat(64)}`;

const isBytes32Hex = (v: string): v is Hex => /^0x[a-fA-F0-9]{64}$/.test(v);

/** A label → bytes32. Pass-through if the value is already 32-byte hex. */
export function toBytes32Label(value: string): Hex {
  const trimmed = value.trim();
  if (isBytes32Hex(trimmed)) return trimmed;
  return keccak256(stringToBytes(trimmed));
}

/** dealId is keccak256 of the deal name (documented convention). */
export function dealIdFromName(name: string): Hex {
  return keccak256(stringToBytes(name.trim()));
}

/** Cryptographically-random 32-byte hex, for the CREATE2 salt. */
export function randomBytes32(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** reportURIHash: explicit hash if given, else hash of the URI, else zero. */
function resolveReportHash(values: DealWizardValues): Hex {
  if (values.reportURIHash && isBytes32Hex(values.reportURIHash)) {
    return values.reportURIHash;
  }
  if (values.reportURI && values.reportURI.trim() !== "") {
    return keccak256(stringToBytes(values.reportURI.trim()));
  }
  return ZERO_BYTES32;
}

/**
 * Build the on-chain DealConfig tuple from validated wizard values.
 * Numeric strings → bigint; labels → bytes32. The object keys match the
 * ABI tuple component names so viem encodes it directly.
 */
export function buildDealConfig(values: DealWizardValues): DealConfig {
  return {
    dealId: dealIdFromName(values.name),
    salt: values.salt as Hex,
    category: toBytes32Label(values.category),
    assetType: toBytes32Label(values.assetType),
    dealAdmin: values.dealAdmin as `0x${string}`,
    platformProposer: values.platformProposer as `0x${string}`,
    issuerExecutor: values.issuerExecutor as `0x${string}`,
    timelockMinDelay: BigInt(values.timelockMinDelay),
    tokenParams: {
      name: values.name,
      symbol: values.symbol,
      decimals: Number(values.decimals),
      description: values.description,
      treasury: values.treasury as `0x${string}`,
      globalMintCap: BigInt(values.globalMintCap),
      spvLegalEntity: values.spvLegalEntity as `0x${string}`,
      dealMetadataURI: values.dealMetadataURI ?? "",
      unitPriceAtIssuance: BigInt(values.unitPriceAtIssuance),
      classes: values.classes.map((c) => ({
        shareClass: c.shareClass,
        classMintCap: BigInt(c.classMintCap),
        subscribable: c.subscribable,
        managerMintOnly: c.managerMintOnly,
        holdPeriodDays: Number(c.holdPeriodDays),
        subTiers: c.subTiers.map((t) => ({
          tierId: Number(t.tierId),
          label: t.label,
          minimumCommitment: BigInt(t.minimumCommitment),
          classSplitBps: Number(t.classSplitBps),
          classBSplitBps: Number(t.classBSplitBps),
        })),
      })),
      combinedCap: {
        cap: values.combinedCapEnabled ? BigInt(values.combinedCap) : BigInt(0),
        applicableClasses: values.combinedCapEnabled ? values.combinedCapClasses : [],
      },
    },
    oracleParams: {
      maxNavChangeBps: BigInt(values.maxNavChangeBps),
      stalenessWarningSeconds: BigInt(values.stalenessWarningSeconds),
      initialAttestation: {
        navPerUnitCents: BigInt(values.navPerUnitCents),
        asOfTimestamp: BigInt(values.asOfTimestamp),
        reportURIHash: resolveReportHash(values),
        reportURI: values.reportURI ?? "",
        methodologyNote: values.methodologyNote ?? "",
      },
    },
    complianceParams: {
      accreditationValidity: BigInt(values.accreditationValidity),
      holdPeriodClassA: BigInt(values.holdPeriodClassA),
      holdPeriodClassAA: BigInt(values.holdPeriodClassAA),
    },
    distributionParams: {
      calculator: values.calculator as `0x${string}`,
    },
    capitalCallParams: {
      executionGracePeriod: BigInt(values.executionGracePeriod),
    },
  };
}
