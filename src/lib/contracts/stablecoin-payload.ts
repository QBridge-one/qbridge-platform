// ============================================================
// lib/contracts/stablecoin-payload.ts
//
// Deterministic mapping from wizard form values → StablecoinConfig tuple
// for StablecoinFactory.createStablecoin. Mirrors factory-payload.ts.
// Numeric strings → bigint; labels → bytes32 (keccak256).
// ============================================================

import { keccak256, stringToBytes } from "viem";
import type { Hex } from "../core/types";
import type { StablecoinConfig } from "@/types/stablecoin";
import type { StablecoinWizardValues } from "../validators/stablecoin-wizard";
import { toBytes32Label, randomBytes32, ZERO_BYTES32 } from "./factory-payload";

export { toBytes32Label, randomBytes32, ZERO_BYTES32 };

/** stablecoinId is keccak256 of the name (same convention as dealId). */
export function stablecoinIdFromName(name: string): Hex {
  return keccak256(stringToBytes(name.trim()));
}

/**
 * Build the on-chain StablecoinConfig tuple from validated wizard values.
 * Object keys match the ABI tuple component names so viem encodes directly.
 */
export function buildStablecoinConfig(values: StablecoinWizardValues): StablecoinConfig {
  return {
    stablecoinId: stablecoinIdFromName(values.name),
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
      maxReserveAttestationAge: BigInt(values.maxReserveAttestationAge),
    },
    reserveOracleParams: {
      maxReserveChangeBps: BigInt(values.maxReserveChangeBps),
      stalenessWarningSeconds: BigInt(values.stalenessWarningSeconds),
    },
    complianceParams: {
      transferPolicy: Number(values.transferPolicy),
    },
  };
}
