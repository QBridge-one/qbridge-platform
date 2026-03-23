import * as fs from "fs";
import * as path from "path";
import type { ContractManifest } from "./manifest-schema";

export interface AbiFunctionItem {
  type: "function";
  name: string;
  inputs: { name: string; type: string; internalType?: string; components?: unknown[] }[];
  outputs?: { name: string; type: string; internalType?: string; components?: unknown[] }[];
  stateMutability: string;
}

/** Custom errors from the full artifact — included in generated ABI so viem can decode reverts in simulateContract. */
export interface AbiErrorItem {
  type: "error";
  name: string;
  inputs: { name: string; type: string; internalType?: string; components?: unknown[] }[];
}

export type AbiExportItem = AbiFunctionItem | AbiErrorItem;

export interface ResolvedAbi {
  readFunctions: AbiFunctionItem[];
  writeFunctions: AbiFunctionItem[];
  /** Functions in manifest order + all `error` entries from abi.json (for decodeErrorResult / simulate). */
  filteredAbi: AbiExportItem[];
}

function isAbiFunction(x: unknown): x is AbiFunctionItem {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return o.type === "function" && typeof o.name === "string" && typeof o.stateMutability === "string";
}

function isAbiError(x: unknown): x is AbiErrorItem {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.type !== "error" || typeof o.name !== "string") return false;
  if (!Array.isArray(o.inputs)) return false;
  return true;
}

function loadRawAbi(repoRoot: string, abiPath: string): unknown[] {
  const full = path.isAbsolute(abiPath) ? abiPath : path.join(repoRoot, abiPath);
  const raw = JSON.parse(fs.readFileSync(full, "utf8")) as unknown[];
  return Array.isArray(raw) ? raw : [];
}

export function loadAbiFromDisk(repoRoot: string, abiPath: string): AbiFunctionItem[] {
  return loadRawAbi(repoRoot, abiPath).filter(isAbiFunction);
}

export function resolveAbiForManifest(
  repoRoot: string,
  manifest: ContractManifest,
): ResolvedAbi {
  const raw = loadRawAbi(repoRoot, manifest.abiPath);
  const all = raw.filter(isAbiFunction);
  const errors = raw.filter(isAbiError);
  const want = new Set(manifest.functions.include);
  const filteredFunctions = all.filter((f) => want.has(f.name));
  const filteredAbi: AbiExportItem[] = [...filteredFunctions, ...errors];
  const readFunctions: AbiFunctionItem[] = [];
  const writeFunctions: AbiFunctionItem[] = [];
  for (const f of filteredFunctions) {
    const sm = f.stateMutability;
    if (sm === "view" || sm === "pure") {
      readFunctions.push(f);
    } else if (sm === "nonpayable" || sm === "payable") {
      writeFunctions.push(f);
    }
  }
  return { readFunctions, writeFunctions, filteredAbi };
}
