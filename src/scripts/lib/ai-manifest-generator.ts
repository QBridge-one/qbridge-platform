// ============================================================
// scripts/lib/ai-manifest-generator.ts
//
// Builds manifest.json from abi.json via an LLM (overwrites existing).
//
// Providers (no extra npm deps — uses fetch):
//   - Anthropic Claude (ANTHROPIC_API_KEY)
//   - Google Gemini (GEMINI_API_KEY)
//
// MANIFEST_AI_PROVIDER:
//   - auto (default): try Claude first if key set; on billing/rate limits, fall back to Gemini if key set
//   - anthropic | gemini: force that provider only
//
// The manifest is written to disk for review; edit and use --keep-manifest if needed.
// ============================================================

import fs from "fs";
import path from "path";

// ─── Types ───────────────────────────────────────────────────

type AbiFunction = {
  type: string;
  name?: string;
  inputs?: unknown[];
  outputs?: unknown[];
  stateMutability?: string;
};

interface GeneratedManifest {
  contractName: string;
  featureKey: string;
  contractAddressKey: string;
  abiPath: string;
  functions: {
    include: string[];
    overrides: Record<
      string,
      {
        displayName?: string;
        description?: string;
        successMessage?: string;
        dangerous?: boolean;
        paramLabels?: Record<string, string>;
      }
    >;
  };
}

// ─── Claude prompt ───────────────────────────────────────────

function buildPrompt(featureKey: string, abiPath: string, functions: AbiFunction[]): string {
  const functionList = JSON.stringify(functions, null, 2);

  return `You are a TypeScript developer working on QBridge, an institutional RWA tokenization platform.

Given a Solidity contract ABI, generate a manifest.json for our codegen system.

## Rules

1. contractName: PascalCase version of the featureKey (e.g. "issuer-registry" → "IssuerRegistry")
2. featureKey: use exactly "${featureKey}"
3. contractAddressKey: camelCase version of featureKey (e.g. "issuerRegistry")
4. abiPath: use exactly "${abiPath}"
5. functions.include: include functions that make sense in an institutional dashboard UI.
   SKIP functions that are: internal plumbing (multicall, consumeScheduledOp, hashOperation),
   or very low-level (getNonce, expiration, minSetback).
   INCLUDE functions that: manage roles, control access, configure compliance, or query state.
6. functions.overrides: for EVERY included function, add:
   - displayName: human-readable title (Title Case, no jargon)
   - description: one sentence explaining what it does in plain English
   - successMessage: short confirmation message shown after success
   - dangerous: true only if the action is irreversible or high risk (e.g. revoking access, closing a target)
   - paramLabels: human-readable label for EVERY parameter (no raw Solidity names like "roleId" — use "Role ID", "account" → "Wallet Address", etc.)

## Contract ABI functions

${functionList}

## Output

Respond with ONLY valid JSON. No markdown, no explanation, no code fences.
The JSON must exactly match this TypeScript interface:

{
  contractName: string,
  featureKey: string,
  contractAddressKey: string,
  abiPath: string,
  functions: {
    include: string[],
    overrides: {
      [functionName: string]: {
        displayName: string,
        description: string,
        successMessage: string,
        dangerous: boolean,
        paramLabels: { [paramName: string]: string }
      }
    }
  }
}`;
}

// ─── LLM API calls (fetch only) ──────────────────────────────

type HttpError = Error & { status: number; body: string };

function attachHttpError(err: Error, status: number, body: string): HttpError {
  const e = err as HttpError;
  e.status = status;
  e.body = body;
  return e;
}

async function callAnthropic(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set.\n" +
        "Add it to .env.local or set it in your shell:\n" +
        "  export ANTHROPIC_API_KEY=sk-ant-...",
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw attachHttpError(new Error(`Anthropic API error ${response.status}: ${text}`), response.status, text);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const textBlock = data.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text content in Claude response");

  return textBlock.text.trim();
}

/**
 * Built-in fallbacks after GEMINI_MODEL / GEMINI_MODEL_TRY.
 * Use versioned IDs — bare `gemini-1.5-flash` often 404s on v1beta.
 */
const BUILTIN_GEMINI_FALLBACKS = [
  "gemini-flash-latest",
  "gemini-2.5-flash-preview",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash-001",
  "gemini-1.5-pro-002",
] as const;

function buildStaticGeminiModelCandidates(): string[] {
  const strict = process.env.GEMINI_DISABLE_MODEL_FALLBACK === "1";
  const primary = (process.env.GEMINI_MODEL ?? "").trim() || "gemini-flash-latest";
  const extra =
    process.env.GEMINI_MODEL_TRY?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const ordered: string[] = [];
  const add = (m: string) => {
    if (m && !ordered.includes(m)) ordered.push(m);
  };
  add(primary);
  for (const x of extra) add(x);
  if (strict) return ordered;
  for (const b of BUILTIN_GEMINI_FALLBACKS) add(b);
  return ordered;
}

/** Prefer flash / newer models when auto-discovering from the Models API. */
function preferGeminiModelOrder(ids: string[]): string[] {
  const score = (id: string) => {
    const x = id.toLowerCase();
    let s = 0;
    if (x.includes("embedding")) return -999;
    if (x.includes("aqa")) return -100;
    if (x.includes("flash")) s += 80;
    if (x.includes("lite")) s += 20;
    if (x.includes("2.5")) s += 45;
    if (x.includes("2.0")) s += 40;
    if (x.includes("1.5")) s += 25;
    if (x.includes("pro")) s += 30;
    if (x.includes("preview") || x.includes("exp")) s += 5;
    return s;
  };
  return [...new Set(ids)].sort((a, b) => score(b) - score(a));
}

async function listGeminiGenerateContentModelIds(apiKey: string): Promise<string[]> {
  const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("pageSize", "100");
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = (await res.json()) as {
    models?: Array<{ name: string; supportedGenerationMethods?: string[] }>;
  };
  const ids: string[] = [];
  for (const m of data.models ?? []) {
    const methods = m.supportedGenerationMethods ?? [];
    if (!methods.includes("generateContent")) continue;
    const id = m.name.replace(/^models\//, "");
    if (!id || id.toLowerCase().includes("embedding")) continue;
    ids.push(id);
  }
  return preferGeminiModelOrder(ids);
}

async function callGeminiSingleModel(apiKey: string, model: string, prompt: string): Promise<string> {
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
  );
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    }),
  });

  const rawText = await response.text();

  if (!response.ok) {
    throw attachHttpError(new Error(`Gemini API error ${response.status}: ${rawText}`), response.status, rawText);
  }

  let data: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    error?: { message?: string };
  };
  try {
    data = JSON.parse(rawText) as typeof data;
  } catch {
    throw new Error(`Gemini returned non-JSON: ${rawText.slice(0, 300)}`);
  }

  if (data.error?.message) {
    throw new Error(`Gemini API: ${data.error.message}`);
  }

  const part = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!part) {
    const reason = data.candidates?.[0]?.finishReason ?? "unknown";
    throw new Error(`No text in Gemini response (finishReason: ${reason})`);
  }

  return part.trim();
}

function shouldTryNextGeminiModel(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const e = err as Partial<HttpError>;
  const st = e.status;
  if (st === 401) return false;
  if (st === 404 || st === 429 || st === 503) return true;
  if (st === 403) return true;
  return false;
}

function shortGeminiFailure(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const e = err as HttpError;
  const line = e.message.split("\n")[0] ?? e.message;
  return line.length > 120 ? `${line.slice(0, 117)}...` : line;
}

/** Google AI Studio — tries GEMINI_MODEL, then fallbacks, then models.list for this key. */
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set.\n" +
        "Get a key from Google AI Studio and add to .env.local:\n" +
        "  export GEMINI_API_KEY=...",
    );
  }

  const tried = new Set<string>();
  const errorLog: string[] = [];

  const attempt = async (model: string, note: string): Promise<string | null> => {
    if (tried.has(model)) return null;
    tried.add(model);
    try {
      const text = await callGeminiSingleModel(apiKey, model, prompt);
      if (note !== "primary") {
        console.warn(`  │  ⚠  Gemini OK with model "${model}" (${note})`);
      }
      return text;
    } catch (e) {
      errorLog.push(`[${model}] ${shortGeminiFailure(e)}`);
      if (!shouldTryNextGeminiModel(e)) throw e;
      console.warn(`  │  ⚠  Gemini model "${model}" failed (${shortGeminiFailure(e)}); trying next...`);
      return null;
    }
  };

  const staticList = buildStaticGeminiModelCandidates();
  for (const model of staticList) {
    const text = await attempt(model, staticList[0] === model ? "primary" : "fallback");
    if (text !== null) return text;
  }

  if (process.env.GEMINI_SKIP_MODEL_DISCOVERY !== "1") {
    console.warn(`  │  ⚠  Querying Gemini API for models that support generateContent...`);
    const discovered = await listGeminiGenerateContentModelIds(apiKey);
    for (const model of discovered) {
      if (tried.has(model)) continue;
      const text = await attempt(model, "discovered");
      if (text !== null) return text;
    }
  }

  throw new Error(
    `Gemini: no model succeeded for manifest generation.\n\n` +
      `Attempts logged:\n${errorLog.map((l) => `  - ${l}`).join("\n")}\n\n` +
      `If errors mention "limit: 0" or free-tier quota, enable billing on the Google Cloud project ` +
      `linked to AI Studio, or add Anthropic credits.\n` +
      `Inspect available IDs: curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"\n` +
      `Then set GEMINI_MODEL to an id from that list (often includes a version suffix).\n` +
      `Options: GEMINI_DISABLE_MODEL_FALLBACK=1 (only GEMINI_MODEL + GEMINI_MODEL_TRY), GEMINI_SKIP_MODEL_DISCOVERY=1`,
  );
}

/** True when Anthropic failed for quota/billing — safe to try Gemini as fallback. */
function shouldTryGeminiAfterAnthropicFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const e = err as HttpError;
  const status = e.status;
  const blob = `${e.message}\n${e.body ?? ""}`.toLowerCase();
  if (status === 429 || status === 402) return true;
  if (
    status === 400 &&
    (blob.includes("credit") || blob.includes("billing") || blob.includes("balance") || blob.includes("quota"))
  ) {
    return true;
  }
  return false;
}

function shortErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const line = err.message.split("\n")[0] ?? err.message;
  return line.length > 140 ? `${line.slice(0, 137)}...` : line;
}

/**
 * Run prompt against configured provider(s). Returns assistant text + label for logs.
 */
async function runLlmForManifest(prompt: string): Promise<{ text: string; providerLabel: string }> {
  const mode = (process.env.MANIFEST_AI_PROVIDER ?? "auto").toLowerCase().trim();
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());

  if (mode === "gemini") {
    const text = await callGemini(prompt);
    return { text, providerLabel: "Gemini" };
  }

  if (mode === "anthropic") {
    const text = await callAnthropic(prompt);
    return { text, providerLabel: "Claude" };
  }

  // auto
  if (hasAnthropic) {
    try {
      const text = await callAnthropic(prompt);
      return { text, providerLabel: "Claude" };
    } catch (e) {
      if (hasGemini && shouldTryGeminiAfterAnthropicFailure(e)) {
        console.warn(`  │  ⚠  Anthropic failed (${shortErrorMessage(e)}); trying Gemini fallback...`);
        const text = await callGemini(prompt);
        return { text, providerLabel: "Gemini (fallback)" };
      }
      throw e;
    }
  }

  if (hasGemini) {
    const text = await callGemini(prompt);
    return { text, providerLabel: "Gemini" };
  }

  throw new Error(
    "No LLM API key configured for manifest generation.\n" +
      "Set ANTHROPIC_API_KEY and/or GEMINI_API_KEY in .env.local (or use MANIFEST_AI_PROVIDER).",
  );
}

// ─── Parse + validate response ────────────────────────────────

function parseManifestResponse(raw: string): GeneratedManifest {
  // Strip markdown fences if Claude added them despite instructions
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as GeneratedManifest;
  } catch {
    throw new Error(`LLM returned invalid JSON.\n` + `Raw response:\n${raw.slice(0, 500)}`);
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Generate manifest.json from abi.json via Claude and/or Gemini (see module header).
 * Overwrites any existing manifest.json in the contract folder.
 */
export async function generateManifest(
  contractDir: string, // absolute path to src/contracts/<feature-key>/
  projectRoot: string, // absolute path to src/
): Promise<GeneratedManifest> {
  const featureKey = path.basename(contractDir);
  const abiAbsPath = path.join(contractDir, "abi.json");
  const manifestOut = path.join(contractDir, "manifest.json");

  // Load ABI
  if (!fs.existsSync(abiAbsPath)) {
    throw new Error(`No abi.json found in ${contractDir}`);
  }

  const rawAbi = JSON.parse(fs.readFileSync(abiAbsPath, "utf-8"));
  const abi: AbiFunction[] = (Array.isArray(rawAbi) ? rawAbi : rawAbi.abi).filter(
    (item: AbiFunction) => item.type === "function",
  );

  if (abi.length === 0) {
    throw new Error(`No functions found in ABI at ${abiAbsPath}`);
  }

  // Relative abiPath for the manifest (relative to projectRoot)
  const abiRelPath = path.relative(projectRoot, abiAbsPath).replace(/\\/g, "/");

  console.log(`  ✦ Generating manifest.json via LLM...`);
  console.log(`    Contract folder : ${featureKey}`);
  console.log(`    Functions in ABI: ${abi.length}`);

  const prompt = buildPrompt(featureKey, abiRelPath, abi);
  const { text: response, providerLabel } = await runLlmForManifest(prompt);
  console.log(`    Provider        : ${providerLabel}`);
  const manifest = parseManifestResponse(response);

  // Ensure abiPath and featureKey are correct (Claude might hallucinate)
  manifest.abiPath = abiRelPath;
  manifest.featureKey = featureKey;

  // Write to disk
  fs.writeFileSync(manifestOut, JSON.stringify(manifest, null, 2) + "\n", "utf-8");

  console.log(`  ✓ manifest.json written → ${path.relative(projectRoot, manifestOut)}`);
  console.log(`    Included functions: ${manifest.functions.include.join(", ")}`);
  console.log(``);

  return manifest;
}
