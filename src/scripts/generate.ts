#!/usr/bin/env ts-node
// ============================================================
// scripts/generate.ts
//
// Discovers all contracts under src/contracts/*/
// For each contract:
//   - Always regenerates manifest.json via LLM (ANTHROPIC_API_KEY and/or GEMINI_API_KEY; see ai-manifest-generator.ts)
//   - Use --keep-manifest to skip AI when manifest.json already exists (faster / offline)
//
// Usage:
//   yarn generate                          ← all contracts (LLM manifest each time)
//   yarn generate --keep-manifest        ← reuse existing manifest.json if present
//   yarn generate --only issuer-registry   ← one contract
//   yarn generate --manifest <path>        ← explicit manifest file(s), no AI
//
// Skips folders starting with _ or .
// ============================================================

import fs from "fs";
import path from "path";

import { validateManifest, type ContractManifest } from "./lib/manifest-schema";
import { resolveAbiForManifest } from "./lib/abi-resolver";
import { CodeWriter, toHookBaseName } from "./lib/code-writer";
import { generateManifest } from "./lib/ai-manifest-generator";
import { generateReadHookFile } from "./lib/read-hook-generator";
import { generateWriteHookFile } from "./lib/write-hook-generator";
import { generateFormComponent } from "./lib/form-generator";
import {
  generateAbiTs,
  generateTypesTs,
  generateHooksIndex,
  generateComponentsIndex,
  generateRootIndex,
} from "./lib/index-generator";

const scriptsDir = __dirname;
const srcRoot = path.join(scriptsDir, "..");
const repoRoot = path.join(srcRoot, "..");

/** Load .env.local / .env into process.env (ts-node does not do this like `next dev`). */
function applyEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

/** ABI path in manifest is either repo-relative (src/contracts/...) or src-relative (contracts/...). */
function abiResolutionRoot(manifest: ContractManifest): string {
  const p = manifest.abiPath.replace(/\\/g, "/");
  if (p.startsWith("contracts/")) return srcRoot;
  return repoRoot;
}

function discoverContractDirs(): string[] {
  const contractsDir = path.join(srcRoot, "contracts");
  if (!fs.existsSync(contractsDir)) {
    console.error(`\n  ✗ contracts/ folder not found at ${contractsDir}\n`);
    process.exit(1);
  }
  return fs
    .readdirSync(contractsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => path.join(contractsDir, d.name));
}

function parseCli(): { only?: string; keepManifest: boolean; manifestPaths: string[] } {
  const raw = [...process.argv.slice(2)];
  let only: string | undefined;
  const onlyIdx = raw.indexOf("--only");
  if (onlyIdx !== -1) {
    only = raw[onlyIdx + 1];
    raw.splice(onlyIdx, 2);
  }
  let keepManifest = false;
  const kmIdx = raw.indexOf("--keep-manifest");
  if (kmIdx !== -1) {
    keepManifest = true;
    raw.splice(kmIdx, 1);
  }
  const manifestPaths: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a === "--manifest" || a === "-m") {
      const p = raw[i + 1];
      if (!p || p.startsWith("-")) {
        console.error("[generate] Missing path after --manifest (-m)");
        process.exit(1);
      }
      manifestPaths.push(path.resolve(p));
      i++;
    } else if (!a.startsWith("-")) {
      manifestPaths.push(path.resolve(a));
    }
  }
  return { only, keepManifest, manifestPaths };
}

function runCodegen(manifest: ContractManifest, writer: CodeWriter): void {
  const root = abiResolutionRoot(manifest);
  const { readFunctions, writeFunctions, filteredAbi } = resolveAbiForManifest(root, manifest);

  if (filteredAbi.length === 0) {
    console.warn(`  │  ⚠  No ABI items matched manifest — check abiPath and include list.`);
    console.log(`  └─\n`);
    return;
  }

  const outDir = path.join(srcRoot, "lib", "generated", manifest.featureKey);
  const hooksDir = path.join(outDir, "hooks");
  const componentsDir = path.join(outDir, "components");

  console.log(`  │  Contract : ${manifest.contractName}`);
  console.log(`  │  ABI      : ${manifest.abiPath}`);
  console.log(`  │  Writes   : ${writeFunctions.map((f) => f.name).join(", ") || "none"}`);
  console.log(`  │  Reads    : ${readFunctions.map((f) => f.name).join(", ") || "none"}`);
  console.log(`  │  Output   : lib/generated/${manifest.featureKey}/`);

  writer.write(path.join(outDir, "abi.ts"), generateAbiTs(filteredAbi, manifest));

  for (const fn of readFunctions) {
    const name = `use${toHookBaseName(fn.name)}.ts`;
    writer.write(path.join(hooksDir, name), generateReadHookFile(fn, manifest));
  }
  for (const fn of writeFunctions) {
    const name = `use${toHookBaseName(fn.name)}.ts`;
    writer.write(path.join(hooksDir, name), generateWriteHookFile(fn, manifest));
    if (fn.inputs.length > 0) {
      writer.write(
        path.join(componentsDir, `${toHookBaseName(fn.name)}Form.tsx`),
        generateFormComponent(fn, manifest),
      );
    }
  }

  writer.write(path.join(outDir, "types.ts"), generateTypesTs(writeFunctions));
  writer.write(path.join(hooksDir, "index.ts"), generateHooksIndex(readFunctions, writeFunctions));

  const hasForms = writeFunctions.some((f) => f.inputs.length > 0);
  if (hasForms) {
    writer.write(path.join(componentsDir, "index.ts"), generateComponentsIndex(writeFunctions));
  } else if (fs.existsSync(path.join(componentsDir, "index.ts"))) {
    fs.unlinkSync(path.join(componentsDir, "index.ts"));
  }

  writer.write(path.join(outDir, "index.ts"), generateRootIndex(hasForms));

  const { written } = writer.getSummary();
  console.log(`  └─ ✓ ${written} files written → @/lib/generated/${manifest.featureKey}\n`);
}

function runCodegenFromManifestFile(manifestPath: string): void {
  const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const manifest = validateManifest(raw);
  console.log(`\n  ┌─ ${manifest.featureKey}`);
  const writer = new CodeWriter();
  runCodegen(manifest, writer);
}

async function processContractFolder(contractDir: string, keepManifest: boolean): Promise<void> {
  const featureKey = path.basename(contractDir);
  const manifestPath = path.join(contractDir, "manifest.json");
  const abiPathFile = path.join(contractDir, "abi.json");

  console.log(`\n  ┌─ ${featureKey}`);

  if (!fs.existsSync(abiPathFile)) {
    console.log(`  │  ⚠  No abi.json found — skipping.`);
    console.log(`  └─ (add abi.json to src/contracts/${featureKey}/ to enable)\n`);
    return;
  }

  const shouldCallClaude = !keepManifest || !fs.existsSync(manifestPath);
  if (shouldCallClaude) {
    try {
      await generateManifest(contractDir, srcRoot);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  │  ✗ Failed to generate manifest: ${msg}`);
      console.log(`  └─ Skipping ${featureKey}\n`);
      return;
    }
  } else {
    console.log(`  │  Using existing manifest.json (--keep-manifest)\n`);
  }

  let manifest: ContractManifest;
  try {
    const rawManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    manifest = validateManifest(rawManifest);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`  │  ✗ Invalid manifest: ${msg}`);
    console.log(`  └─ Skipping ${featureKey}\n`);
    return;
  }

  const writer = new CodeWriter();
  runCodegen(manifest, writer);
}

async function main(): Promise<void> {
  applyEnvFile(path.join(repoRoot, ".env.local"));
  applyEnvFile(path.join(repoRoot, ".env"));

  const { only, keepManifest, manifestPaths } = parseCli();

  console.log(`\n  QBridge Contract Generator`);
  console.log(`  ──────────────────────────`);

  if (manifestPaths.length > 0) {
    console.log(`\n  Manifest file mode: ${manifestPaths.length} path(s)`);
    for (const p of manifestPaths) {
      if (!fs.existsSync(p)) {
        console.error(`\n  ✗ Manifest not found: ${p}\n`);
        process.exit(1);
      }
      runCodegenFromManifestFile(p);
    }
    console.log(`  All done.\n`);
    return;
  }

  let contractDirs = discoverContractDirs();
  if (only) {
    contractDirs = contractDirs.filter((d) => path.basename(d) === only);
    if (contractDirs.length === 0) {
      console.error(`\n  ✗ No contract folder found matching --only "${only}"\n`);
      process.exit(1);
    }
  }

  console.log(
    `\n  Found ${contractDirs.length} contract folder(s): ${contractDirs.map((d) => path.basename(d)).join(", ")}`,
  );
  if (!keepManifest) {
    console.log(`  Manifest: regenerate via LLM for each folder (pass --keep-manifest to reuse existing)\n`);
  }

  for (const contractDir of contractDirs) {
    await processContractFolder(contractDir, keepManifest);
  }

  console.log(`  All done.\n`);
}

main().catch((err: unknown) => {
  console.error("\n  ✗ Generator failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
