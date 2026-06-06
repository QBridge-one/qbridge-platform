// ============================================================
// lib/container.server.ts
// Server-only DI for identity / org / auth-webhook / wallet-link /
// audit-log adapters. Imported by route handlers, server components,
// services, and middleware. NEVER import from a client component.
//
// ─── Provider switches ──────────────────────────────────────
//
// IDENTITY_PROVIDER  = "none" | "memory" | "clerk"   (default: "none")
//   none   : unauthenticated by default; visitors land on the marketing
//            page. Use this when you don't have a .env yet — it stops
//            the app from auto-redirecting fresh clones into /ops.
//   memory : in-process dev fixture (seeded "QBridge Ops" + "Demo Issuer"
//            orgs, signed in as a synthetic dev_root user). No IdP keys
//            required. Opt-in only.
//   clerk  : Clerk Organizations (requires CLERK_SECRET_KEY etc.)
//
// NEXT_PUBLIC_WALLET_PROVIDER = "privy" | "alchemy" | "turnkey"
//   privy   : Privy embedded MPC wallet (current default)
//   alchemy : Alchemy Account Kit smart account (stubbed)
//   turnkey : Turnkey HSM-backed signer (not yet implemented)
//
// To swap wallet provider:
//   1. Implement the new adapter under src/lib/adapters/wallet/.
//   2. Add it to the pickWalletAdapter() switch in container.ts.
//   3. Update the corresponding *client* side in
//      src/components/providers/ (add a provider tree alongside
//      privy-providers.tsx and select it in wallet-providers.tsx).
//   4. Update src/lib/hooks/useWallet.ts to add the new internal
//      implementation and gate it on the provider.
//   5. Nothing else in /app or /components needs to change — the
//      WalletPort interface is the stable contract.
// ============================================================

import "server-only";

import { memoryIdentityAdapter } from "./adapters/identity/memory.adapter";
import { clerkIdentityAdapter } from "./adapters/identity/clerk.adapter";
import { noneIdentityAdapter } from "./adapters/identity/none.adapter";
import { memoryOrganizationAdapter } from "./adapters/organization/memory.adapter";
import { clerkOrganizationAdapter } from "./adapters/organization/clerk.adapter";
import { memoryAuthWebhookAdapter } from "./adapters/auth-webhook/memory.adapter";
import { clerkAuthWebhookAdapter } from "./adapters/auth-webhook/clerk.adapter";
import { memoryAuditLogAdapter } from "./adapters/audit-log/memory.adapter";
import { drizzleAuditLogAdapter } from "./adapters/audit-log/drizzle.adapter";
import { personaKybAdapter } from "./adapters/kyb-verification/persona.adapter";
import { sumsubKybAdapter } from "./adapters/kyb-verification/sumsub.adapter";
import { memoryPlatformSettingsAdapter } from "./adapters/platform-settings/memory.adapter";
import { drizzlePlatformSettingsAdapter } from "./adapters/platform-settings/drizzle.adapter";
import type { KybVerificationPort } from "./ports/kyb-verification.port";
import type { VerificationProvider } from "./core/kyb-verification";
import { normalizeJurisdictionToCode } from "./data/countries";
import { memoryNotificationAdapter } from "./adapters/notification/memory.adapter";
import { drizzleNotificationAdapter } from "./adapters/notification/drizzle.adapter";
import { consoleEmailAdapter } from "./adapters/email/console.adapter";
import { resendEmailAdapter } from "./adapters/email/resend.adapter";

// ─── Identity provider switch ────────────────────────────────
// Default is "none" so a fresh clone with no .env doesn't auto-log
// the visitor in as the seeded dev fixture user.
const IDENTITY_PROVIDER = (process.env.IDENTITY_PROVIDER ?? "none").toLowerCase();

export const identityAdapter =
  IDENTITY_PROVIDER === "clerk"
    ? clerkIdentityAdapter
    : IDENTITY_PROVIDER === "memory"
      ? memoryIdentityAdapter
      : noneIdentityAdapter;

// org / auth-webhook adapters keep their existing memory fallback —
// when identity is "none" no session exists, so these are unreachable
// from request handlers (requireSession throws first).
export const organizationAdapter =
  IDENTITY_PROVIDER === "clerk" ? clerkOrganizationAdapter : memoryOrganizationAdapter;

export const authWebhookAdapter =
  IDENTITY_PROVIDER === "clerk" ? clerkAuthWebhookAdapter : memoryAuthWebhookAdapter;

/** Exported for read-only UI hints (e.g. dev banner on the landing page). */
export const IDENTITY_PROVIDER_RESOLVED = IDENTITY_PROVIDER as
  | "none"
  | "memory"
  | "clerk"
  | string;

// ─── Wallet provider switch ──────────────────────────────────
// The wallet-link / audit / identity adapters above are vendor-
// agnostic with respect to *which* embedded wallet a user has —
// they only see addresses and signatures. The wallet provider
// itself lives in the client tree (see useWallet.ts and the
// providers under components/providers/). This export documents
// which provider is active for downstream services that need to
// know (e.g. "is this a smart account?" affects gas-policy).
export const WALLET_PROVIDER = (
  process.env.NEXT_PUBLIC_WALLET_PROVIDER ??
  process.env.WALLET_PROVIDER ??
  "privy"
).toLowerCase() as "privy" | "alchemy" | "turnkey";

// ─── DB-backed persistence switches ──────────────────────────
// Audit + notifications use Postgres when DATABASE_URL is set
// (Drizzle adapters lazy-init the pool on first call). On a fresh
// clone with no DB the memory adapters keep dev usable.
const DB_BACKED = Boolean(process.env.DATABASE_URL?.trim());

export const auditLogAdapter = DB_BACKED ? drizzleAuditLogAdapter : memoryAuditLogAdapter;
export const notificationAdapter = DB_BACKED
  ? drizzleNotificationAdapter
  : memoryNotificationAdapter;
export const platformSettingsAdapter = DB_BACKED
  ? drizzlePlatformSettingsAdapter
  : memoryPlatformSettingsAdapter;

// Canonical user→wallet binding (Postgres when DATABASE_URL set, else
// in-memory). The binding module owns its own DB_BACKED switch so the
// Clerk identity / organization adapters can read it directly without a
// circular import through this container. Re-exported here so route
// handlers import it from the same place as the other server adapters.
export { walletBindingAdapter } from "./adapters/wallet-binding";

// ─── Email provider switch ───────────────────────────────────
// EMAIL_PROVIDER  = "console" | "resend"   (default: "console")
//   console : log to stdout — dev / preview / when RESEND_API_KEY missing.
//   resend  : POST to api.resend.com (requires RESEND_API_KEY + EMAIL_FROM).
//
// The contact form route (/api/contact) uses Zoho SMTP via nodemailer
// directly and is NOT wired through this port — keep the platform's
// transactional sender reputation isolated from the human mailbox.
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER ?? "console").toLowerCase();
export const emailAdapter =
  EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY?.trim()
    ? resendEmailAdapter
    : consoleEmailAdapter;

/** Ops workspace id — recipient of platform-wide notifications like
 *  `issuer.kyb_submitted`. Read at request time so a missed env var
 *  degrades gracefully (notifications skip; state changes still apply). */
export const OPS_ORG_ID = process.env.OPS_ORG_ID?.trim() || null;

// ─── KYB verification provider routing ──────────────────────
// Two providers are wired behind the same KybVerificationPort:
//   - Persona  (default — already set up, cheaper for simple flows)
//   - Sumsub   (more comprehensive; supports Canada KYB)
//
// Selection precedence (first match wins):
//   1. jurisdiction override map (KYB_JURISDICTION_PROVIDERS)
//   2. global default (KYB_PROVIDER, default "persona")
//
// To route, e.g., Canadian issuers to Sumsub:
//   KYB_PROVIDER=persona
//   KYB_JURISDICTION_PROVIDERS=canada:sumsub,ca:sumsub
//
// The webhook routes (/api/webhooks/persona, /api/webhooks/sumsub)
// each handle their own provider; the case's stored `provider`
// field records which one owns it so status updates route correctly.
const kybProviders: Record<VerificationProvider, KybVerificationPort | null> = {
  persona: personaKybAdapter,
  sumsub: sumsubKybAdapter,
  manual: null,
};

const KYB_DEFAULT_PROVIDER = (
  process.env.KYB_PROVIDER ?? "persona"
).toLowerCase() as VerificationProvider;

/** Parse "canada:sumsub,ca:sumsub" → { canada: "sumsub", ca: "sumsub" }.
 *  Keys are lowercased jurisdiction tokens; values are provider names. */
function parseJurisdictionMap(): Record<string, VerificationProvider> {
  const raw = process.env.KYB_JURISDICTION_PROVIDERS?.trim();
  if (!raw) return {};
  const out: Record<string, VerificationProvider> = {};
  for (const pair of raw.split(",")) {
    const [k, v] = pair.split(":").map((s) => s.trim().toLowerCase());
    if (k && (v === "persona" || v === "sumsub")) out[k] = v;
  }
  return out;
}
const KYB_JURISDICTION_MAP = parseJurisdictionMap();

/** Pick the verification provider for a case. The jurisdiction is
 *  normalized to an ISO 3166-1 alpha-2 code first, then matched
 *  against the override map; falls back to the global default.
 *
 *  Accepts ISO codes (`CA`), full names (`Canada`), and common
 *  aliases (`USA`, `UK`) — so legacy free-text rows from before the
 *  dropdown ships keep routing correctly without a backfill. */
export function selectKybProvider(opts?: { jurisdiction?: string | null }): KybVerificationPort {
  const raw = opts?.jurisdiction;
  const code = normalizeJurisdictionToCode(raw)?.toLowerCase();
  // Try the normalized code first, then a raw lowercased fallback so
  // map entries written as ISO codes OR full names both work.
  const rawKey = raw?.trim().toLowerCase();
  const key = code ?? rawKey;
  if (key && KYB_JURISDICTION_MAP[key]) {
    const adapter = kybProviders[KYB_JURISDICTION_MAP[key]];
    if (adapter) return adapter;
  }
  const fallback = kybProviders[KYB_DEFAULT_PROVIDER] ?? personaKybAdapter;
  return fallback;
}

/** Look up a provider's adapter by name — used by webhook routes
 *  which already know which provider they serve. */
export function kybProviderByName(name: VerificationProvider): KybVerificationPort | null {
  return kybProviders[name];
}

/** @deprecated Use selectKybProvider(). Kept for the existing start
 *  route until it's migrated; resolves the global default. */
export const kybVerificationAdapter = selectKybProvider();

export type { IdentityPort } from "./ports/identity.port";
export type { OrganizationPort } from "./ports/organization.port";
export type { AuthWebhookPort } from "./ports/auth-webhook.port";
export type { WalletBindingPort } from "./ports/wallet-binding.port";
export type { AuditLogPort } from "./ports/audit-log.port";
export type { NotificationPort } from "./ports/notification.port";
export type { EmailPort } from "./ports/email.port";
export type { KybVerificationPort } from "./ports/kyb-verification.port";
export type { PlatformSettingsPort } from "./ports/platform-settings.port";
