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

export interface ResolvedAbi {
  readFunctions: AbiFunctionItem[];
  writeFunctions: AbiFunctionItem[];
  filteredAbi: AbiFunctionItem[];
}

function isAbiFunction(x: unknown): x is AbiFunctionItem {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return o.type === "function" && typeof o.name === "string" && typeof o.stateMutability === "string";
}

export function loadAbiFromDisk(repoRoot: string, abiPath: string): AbiFunctionItem[] {
  const full = path.isAbsolute(abiPath) ? abiPath : path.join(repoRoot, abiPath);
  const raw = JSON.parse(fs.readFileSync(full, "utf8")) as unknown[];
  return raw.filter(isAbiFunction);
}

export function resolveAbiForManifest(
  repoRoot: string,
  manifest: ContractManifest,
): ResolvedAbi {
  const all = loadAbiFromDisk(repoRoot, manifest.abiPath);
  const want = new Set(manifest.functions.include);
  const filteredAbi = all.filter((f) => want.has(f.name));
  const readFunctions: AbiFunctionItem[] = [];
  const writeFunctions: AbiFunctionItem[] = [];
  for (const f of filteredAbi) {
    const sm = f.stateMutability;
    if (sm === "view" || sm === "pure") {
      readFunctions.push(f);
    } else if (sm === "nonpayable" || sm === "payable") {
      writeFunctions.push(f);
    }
  }
  return { readFunctions, writeFunctions, filteredAbi };
}
