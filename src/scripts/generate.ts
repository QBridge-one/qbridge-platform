#!/usr/bin/env ts-node
// ============================================================
// scripts/generate.ts
//
// Discovers all contracts under src/contracts/*/
// For each contract:
//   - DEFAULT: the committed manifest.json is the source of truth. Codegen is
//     deterministic and never calls an LLM, so re-running never silently
//     re-rolls an already-curated manifest. (If a folder has abi.json but no
//     manifest.json yet, one is drafted via LLM to bootstrap it — then review
//     and commit it.)
//   - Pass --ai-manifest to (re)generate manifest.json via LLM on purpose
//     (ANTHROPIC_API_KEY and/or GEMINI_API_KEY; see ai-manifest-generator.ts).
//     It overwrites manifest.json — review the git diff before committing.
//
// Usage:
//   yarn generate                          ← deterministic, from committed manifests
//   yarn generate --only issuer-registry   ← one contract
//   yarn generate:manifest                 ← (re)draft manifests via LLM, then codegen
//   yarn generate --ai-manifest --only x   ← redraft just one
//   yarn generate --manifest <path>        ← codegen from explicit manifest file(s), no AI
//
// (--keep-manifest is still accepted but is now a no-op — reusing the committed
//  manifest is the default.)
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

function parseCli(): { only?: string; forceAiManifest: boolean; manifestPaths: string[] } {
  const raw = [...process.argv.slice(2)];
  let only: string | undefined;
  const onlyIdx = raw.indexOf("--only");
  if (onlyIdx !== -1) {
    only = raw[onlyIdx + 1];
    raw.splice(onlyIdx, 2);
  }
  // Explicit opt-in: (re)generate manifest.json via LLM. Default is OFF — the
  // committed manifest is the source of truth.
  let forceAiManifest = false;
  const aiIdx = raw.indexOf("--ai-manifest");
  if (aiIdx !== -1) {
    forceAiManifest = true;
    raw.splice(aiIdx, 1);
  }
  // Deprecated no-op: reusing the committed manifest is now the default.
  const kmIdx = raw.indexOf("--keep-manifest");
  if (kmIdx !== -1) raw.splice(kmIdx, 1);

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
  return { only, forceAiManifest, manifestPaths };
}

function runCodegen(manifest: ContractManifest, writer: CodeWriter): void {
  const root = abiResolutionRoot(manifest);
  const { readFunctions, writeFunctions, filteredAbi } = resolveAbiForManifest(root, manifest);

  if (readFunctions.length === 0 && writeFunctions.length === 0) {
    console.warn(`  │  ⚠  No ABI functions matched manifest — check abiPath and include list.`);
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

async function processContractFolder(contractDir: string, forceAiManifest: boolean): Promise<void> {
  const featureKey = path.basename(contractDir);
  const manifestPath = path.join(contractDir, "manifest.json");
  const abiPathFile = path.join(contractDir, "abi.json");

  console.log(`\n  ┌─ ${featureKey}`);

  if (!fs.existsSync(abiPathFile)) {
    console.log(`  │  ⚠  No abi.json found — skipping.`);
    console.log(`  └─ (add abi.json to src/contracts/${featureKey}/ to enable)\n`);
    return;
  }

  // The committed manifest is the source of truth. Only call the LLM when the
  // user explicitly asks (--ai-manifest), or to bootstrap a folder that has no
  // manifest.json yet. Keeps `yarn generate` deterministic and stops it from
  // silently re-rolling already-curated manifests.
  const manifestExists = fs.existsSync(manifestPath);
  const shouldCallAi = forceAiManifest || !manifestExists;
  if (shouldCallAi) {
    if (!manifestExists) {
      console.log(`  │  No manifest.json yet — drafting one via LLM (review & commit it).`);
    } else {
      console.log(`  │  --ai-manifest: regenerating manifest via LLM (overwrites; review the diff).`);
    }
    try {
      await generateManifest(contractDir, srcRoot);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  │  ✗ Failed to generate manifest: ${msg}`);
      console.log(`  └─ Skipping ${featureKey}\n`);
      return;
    }
  } else {
    console.log(`  │  Using committed manifest.json (source of truth)\n`);
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

  const { only, forceAiManifest, manifestPaths } = parseCli();

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
  if (forceAiManifest) {
    console.log(`  Manifest: --ai-manifest → (re)generate via LLM, then codegen (review the diff)\n`);
  } else {
    console.log(`  Manifest: using committed manifest.json (deterministic; --ai-manifest to redraft)\n`);
  }

  for (const contractDir of contractDirs) {
    await processContractFolder(contractDir, forceAiManifest);
  }

  console.log(`  All done.\n`);
}

main().catch((err: unknown) => {
  console.error("\n  ✗ Generator failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
