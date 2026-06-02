// ============================================================
// lib/adapters/kyb-verification/sumsub.adapter.ts
// Sumsub applicant API adapter.
//
// Required env:
//   SUMSUB_APP_TOKEN      — app token (sbx:… or prd:…)
//   SUMSUB_SECRET_KEY     — secret key for request signing
//   SUMSUB_WEBHOOK_SECRET — webhook signature secret
//   SUMSUB_KYC_LEVEL      — level name for individual/KYC flow (future)
//
// KYB level resolution — TWO supported patterns:
//
//   A. Single level (simple, swap value to change):
//      SUMSUB_KYB_LEVEL=full-kyb-level
//
//   B. Tiered (both configured, flip a switch):
//      SUMSUB_KYB_LEVEL_BASIC=basic-kyb-level
//      SUMSUB_KYB_LEVEL_FULL=full-kyb-level
//      SUMSUB_KYB_LEVEL_TIER=full     # which one is active right now
//
// Pattern A takes precedence (legacy). When unset, falls back to
// pattern B keyed by `tier` — defaults to "full" if unspecified.
// Future per-case override can pass tier directly via CreateCaseInput.
//
// Request signing (every API call):
//   X-App-Token, X-App-Access-Ts, X-App-Access-Sig
//   sig = HMAC_SHA256(secretKey, ts + METHOD + path+query + body) hex
//
// Webhook verification:
//   x-payload-digest header over the RAW body; algorithm named in
//   x-payload-digest-alg (HMAC_SHA256_HEX / _SHA1_HEX / _SHA512_HEX).
//
// Docs: https://docs.sumsub.com/reference/about-sumsub-api
// ============================================================

import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { KybVerificationPort } from "../../ports/kyb-verification.port";
import type {
  CreateCaseInput,
  CreateCaseResult,
  KybCaseStatus,
  KybVerificationEvent,
} from "../../core/kyb-verification";
import { providerNotInitialized, webhookSignatureInvalid } from "../../core/errors";

const SUMSUB_API = "https://api.sumsub.com";
const TOKEN_TTL_SECS = 600;

type KybTier = "basic" | "full";

function resolveKybLevel(tier: KybTier): string {
  // Pattern A: single SUMSUB_KYB_LEVEL wins outright. Lets long-time
  // configs keep working without renaming env vars.
  const single = process.env.SUMSUB_KYB_LEVEL?.trim();
  if (single) return single;
  // Pattern B: tiered. Resolve from the matching SUMSUB_KYB_LEVEL_{TIER}.
  if (tier === "basic") return process.env.SUMSUB_KYB_LEVEL_BASIC?.trim() ?? "";
  return process.env.SUMSUB_KYB_LEVEL_FULL?.trim() ?? "";
}

function getActiveTier(): KybTier {
  const raw = process.env.SUMSUB_KYB_LEVEL_TIER?.trim().toLowerCase();
  return raw === "basic" ? "basic" : "full";
}

function getConfig() {
  const appToken = process.env.SUMSUB_APP_TOKEN?.trim();
  const secretKey = process.env.SUMSUB_SECRET_KEY?.trim();
  const webhookSecret = process.env.SUMSUB_WEBHOOK_SECRET?.trim();
  const kycLevel = process.env.SUMSUB_KYC_LEVEL?.trim();
  if (!appToken) throw providerNotInitialized("Sumsub (missing SUMSUB_APP_TOKEN)");
  if (!secretKey) throw providerNotInitialized("Sumsub (missing SUMSUB_SECRET_KEY)");
  return {
    appToken,
    secretKey,
    webhookSecret: webhookSecret ?? "",
    /** Active default level — picked from env via the A/B resolver.
     *  `createCase` calls resolveKybLevel(tier) directly when a
     *  per-case tier override arrives, so this is the boot-time default
     *  used when CreateCaseInput doesn't specify one. */
    kybLevel: resolveKybLevel(getActiveTier()),
    kycLevel: kycLevel ?? "",
  };
}

/** Sign + execute a Sumsub API request. `pathWithQuery` must include
 *  any query string (it's part of the signed payload). */
async function sumsubFetch(
  method: "GET" | "POST",
  pathWithQuery: string,
  body: string | null,
): Promise<Response> {
  const { appToken, secretKey } = getConfig();
  const ts = Math.floor(Date.now() / 1000).toString();
  const payload = ts + method + pathWithQuery + (body ?? "");
  const sig = createHmac("sha256", secretKey).update(payload).digest("hex");

  return fetch(`${SUMSUB_API}${pathWithQuery}`, {
    method,
    headers: {
      "X-App-Token": appToken,
      "X-App-Access-Ts": ts,
      "X-App-Access-Sig": sig,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ?? undefined,
  });
}

/** Sumsub reviewAnswer (GREEN/RED) + reviewStatus → our status. */
function mapSumsubStatus(
  reviewStatus: string | undefined,
  reviewAnswer: string | undefined,
  rejectType: string | undefined,
): KybCaseStatus {
  if (reviewAnswer === "GREEN") return "approved";
  if (reviewAnswer === "RED") {
    // RETRY = applicant can resubmit; FINAL = hard decline.
    return rejectType === "RETRY" ? "needs_review" : "declined";
  }
  switch (reviewStatus) {
    case "init":
      return "created";
    case "pending":
    case "queued":
      return "pending";
    case "onHold":
      return "needs_review";
    case "completed":
      // completed without a GREEN/RED yet — treat as needs_review.
      return "needs_review";
    default:
      return "pending";
  }
}

interface SumsubApplicantResponse {
  id: string;
  review?: { reviewStatus?: string };
}

interface SumsubAccessTokenResponse {
  token: string;
  userId: string;
}

interface SumsubWebhookPayload {
  type?: string;
  applicantId?: string;
  externalUserId?: string;
  reviewStatus?: string;
  reviewResult?: {
    reviewAnswer?: string;
    reviewRejectType?: string;
  };
}

class SumsubKybAdapter implements KybVerificationPort {
  readonly provider = "sumsub" as const;

  async createCase(input: CreateCaseInput): Promise<CreateCaseResult> {
    const { kybLevel: defaultKybLevel, kycLevel } = getConfig();
    const type = input.type ?? "kyb";
    // Per-case tier override (from DB platform-settings or future UI)
    // wins over the env default. Falls back to env when unset.
    const kybLevel = input.tier
      ? resolveKybLevel(input.tier)
      : defaultKybLevel;
    const levelName = type === "kyc" ? kycLevel : kybLevel;
    if (!levelName) {
      const hint =
        type === "kyc"
          ? "SUMSUB_KYC_LEVEL"
          : "SUMSUB_KYB_LEVEL (or SUMSUB_KYB_LEVEL_BASIC / SUMSUB_KYB_LEVEL_FULL + SUMSUB_KYB_LEVEL_TIER)";
      throw providerNotInitialized(`Sumsub (missing ${hint})`);
    }

    // externalUserId is our stable subject id (org id for KYB). Sumsub
    // dedupes by it — calling create for an existing externalUserId
    // returns the existing applicant (409 handled below).
    const applicantBody = JSON.stringify({
      externalUserId: input.orgId,
      email: input.contactEmail || undefined,
      type: type === "kyb" ? "company" : "individual",
      ...(type === "kyb"
        ? {
            companyInfo: {
              companyName: input.orgName,
              ...(input.jurisdiction ? { country: input.jurisdiction } : {}),
            },
          }
        : {}),
    });

    const createPath = `/resources/applicants?levelName=${encodeURIComponent(levelName)}`;
    const res = await sumsubFetch("POST", createPath, applicantBody);

    let applicantId: string;
    if (res.ok) {
      const body = (await res.json()) as SumsubApplicantResponse;
      applicantId = body.id;
    } else if (res.status === 409) {
      // Applicant already exists for this externalUserId — look it up.
      applicantId = await this.resolveApplicantId(input.orgId);
    } else {
      throw new Error(`Sumsub createApplicant failed: ${await describeError(res)}`);
    }

    const token = await this.mintAccessToken(input.orgId, levelName);
    return {
      caseId: applicantId,
      provider: "sumsub",
      sessionToken: token,
      status: "created",
    };
  }

  private async resolveApplicantId(externalUserId: string): Promise<string> {
    const path = `/resources/applicants/-;externalUserId=${encodeURIComponent(externalUserId)}/one`;
    const res = await sumsubFetch("GET", path, null);
    if (!res.ok) {
      throw new Error(`Sumsub resolveApplicant failed: ${await describeError(res)}`);
    }
    const body = (await res.json()) as SumsubApplicantResponse;
    return body.id;
  }

  private async mintAccessToken(externalUserId: string, levelName: string): Promise<string> {
    const path =
      `/resources/accessTokens?userId=${encodeURIComponent(externalUserId)}` +
      `&levelName=${encodeURIComponent(levelName)}&ttlInSecs=${TOKEN_TTL_SECS}`;
    const res = await sumsubFetch("POST", path, null);
    if (!res.ok) {
      throw new Error(`Sumsub accessToken failed: ${await describeError(res)}`);
    }
    const body = (await res.json()) as SumsubAccessTokenResponse;
    return body.token;
  }

  async getCaseStatus(caseId: string): Promise<KybCaseStatus> {
    const path = `/resources/applicants/${encodeURIComponent(caseId)}/status`;
    const res = await sumsubFetch("GET", path, null);
    if (!res.ok) throw new Error(`Sumsub getCaseStatus failed: ${res.status}`);
    const body = (await res.json()) as {
      reviewStatus?: string;
      reviewResult?: { reviewAnswer?: string; reviewRejectType?: string };
    };
    return mapSumsubStatus(
      body.reviewStatus,
      body.reviewResult?.reviewAnswer,
      body.reviewResult?.reviewRejectType,
    );
  }

  async handleWebhook(request: Request): Promise<KybVerificationEvent> {
    const { webhookSecret } = getConfig();
    const rawBody = await request.text();
    const digest = request.headers.get("x-payload-digest") ?? "";
    const alg = request.headers.get("x-payload-digest-alg") ?? "HMAC_SHA256_HEX";

    if (webhookSecret) {
      verifyDigest(rawBody, digest, alg, webhookSecret);
    }

    const payload = JSON.parse(rawBody) as SumsubWebhookPayload;
    const status = mapSumsubStatus(
      payload.reviewStatus,
      payload.reviewResult?.reviewAnswer,
      payload.reviewResult?.reviewRejectType,
    );

    return {
      caseId: payload.applicantId ?? "",
      orgId: payload.externalUserId ?? "",
      status,
      providerEvent: payload.type ?? "unknown",
      raw: payload as unknown as Record<string, unknown>,
    };
  }
}

async function describeError(res: Response): Promise<string> {
  let detail = `${res.status} ${res.statusText}`;
  try {
    const err = await res.json();
    const msg = err?.description ?? err?.errorName ?? JSON.stringify(err);
    if (msg) detail = `${detail} — ${msg}`;
  } catch {
    /* ignore */
  }
  return detail;
}

const DIGEST_ALG: Record<string, string> = {
  HMAC_SHA1_HEX: "sha1",
  HMAC_SHA256_HEX: "sha256",
  HMAC_SHA512_HEX: "sha512",
};

function verifyDigest(
  body: string,
  digest: string,
  alg: string,
  secret: string,
): void {
  const nodeAlg = DIGEST_ALG[alg];
  if (!nodeAlg || !digest) throw webhookSignatureInvalid();
  const expected = createHmac(nodeAlg, secret).update(body).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(digest, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw webhookSignatureInvalid();
  }
}

export const sumsubKybAdapter = new SumsubKybAdapter();
