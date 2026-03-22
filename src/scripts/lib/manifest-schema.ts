import * as fs from "fs";

export interface FunctionOverride {
  displayName?: string;
  description?: string;
  dangerous?: boolean;
  paramLabels?: Record<string, string>;
}

export interface ContractManifest {
  contractName: string;
  featureKey: string;
  contractAddressKey: string;
  abiPath: string;
  functions: {
    include: string[];
    overrides?: Record<string, FunctionOverride>;
  };
}

export function validateManifest(data: unknown): ContractManifest {
  if (!data || typeof data !== "object") {
    throw new Error("Manifest must be a JSON object");
  }
  const m = data as Record<string, unknown>;
  if (typeof m.contractName !== "string" || !m.contractName) {
    throw new Error("manifest.contractName is required");
  }
  if (typeof m.featureKey !== "string" || !m.featureKey) {
    throw new Error("manifest.featureKey is required");
  }
  if (typeof m.contractAddressKey !== "string" || !m.contractAddressKey) {
    throw new Error("manifest.contractAddressKey is required");
  }
  if (typeof m.abiPath !== "string" || !m.abiPath) {
    throw new Error("manifest.abiPath is required");
  }
  if (!m.functions || typeof m.functions !== "object") {
    throw new Error("manifest.functions is required");
  }
  const fn = m.functions as Record<string, unknown>;
  if (!Array.isArray(fn.include) || fn.include.some((x) => typeof x !== "string")) {
    throw new Error("manifest.functions.include must be an array of strings");
  }
  if (fn.overrides != null && (typeof fn.overrides !== "object" || Array.isArray(fn.overrides))) {
    throw new Error("manifest.functions.overrides must be an object");
  }
  return m as unknown as ContractManifest;
}

export function readManifestFile(filePath: string): ContractManifest {
  const raw = fs.readFileSync(filePath, "utf8");
  return validateManifest(JSON.parse(raw));
}
