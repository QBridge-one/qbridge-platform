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
// WALLET_PROVIDER    = "web3auth" | "alchemy" | "turnkey"
//   web3auth : Web3Auth embedded EOA (current default)
//   alchemy  : Alchemy Account Kit smart account (stubbed)
//   turnkey  : Turnkey HSM-backed signer (not yet implemented)
//
// To swap wallet provider:
//   1. Implement the new adapter under src/lib/adapters/wallet/.
//   2. Add it to the WALLET_PROVIDER switch below.
//   3. Update the corresponding *client* side in
//      src/components/providers/ (e.g., add an Alchemy AccountProvider
//      tree alongside web3auth-providers.tsx and pick which to mount).
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
import { memoryWalletLinkAdapter } from "./adapters/wallet-link/memory.adapter";
import { clerkWalletLinkAdapter } from "./adapters/wallet-link/clerk.adapter";
import { memoryAuditLogAdapter } from "./adapters/audit-log/memory.adapter";
import { drizzleAuditLogAdapter } from "./adapters/audit-log/drizzle.adapter";
import { personaKybAdapter } from "./adapters/kyb-verification/persona.adapter";
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

// Wallet linking persists the SIWE-verified address into the same
// store the IdentityPort reads `primaryWallet` from. Keep these
// two in sync — if you swap identity providers, swap the matching
// wallet-link adapter as well.
export const walletLinkAdapter =
  IDENTITY_PROVIDER === "clerk" ? clerkWalletLinkAdapter : memoryWalletLinkAdapter;

// ─── Wallet provider switch ──────────────────────────────────
// The wallet-link / audit / identity adapters above are vendor-
// agnostic with respect to *which* embedded wallet a user has —
// they only see addresses and signatures. The wallet provider
// itself lives in the client tree (see useWallet.ts and the
// providers under components/providers/). This export documents
// which provider is active for downstream services that need to
// know (e.g. "is this a smart account?" affects gas-policy).
export const WALLET_PROVIDER = (process.env.WALLET_PROVIDER ?? "web3auth").toLowerCase() as
  | "web3auth"
  | "alchemy"
  | "turnkey";

// ─── DB-backed persistence switches ──────────────────────────
// Audit + notifications use Postgres when DATABASE_URL is set
// (Drizzle adapters lazy-init the pool on first call). On a fresh
// clone with no DB the memory adapters keep dev usable.
const DB_BACKED = Boolean(process.env.DATABASE_URL?.trim());

export const auditLogAdapter = DB_BACKED ? drizzleAuditLogAdapter : memoryAuditLogAdapter;
export const notificationAdapter = DB_BACKED
  ? drizzleNotificationAdapter
  : memoryNotificationAdapter;

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

// ─── KYB verification provider switch ───────────────────────
// KYB_PROVIDER  = "persona"   (default when PERSONA_API_KEY set)
// Today only Persona is wired; future adapters (Sumsub, manual)
// plug in here with the same port. When the env var is missing
// the adapter is still exported but will throw on first use.
export const kybVerificationAdapter = personaKybAdapter;

export type { IdentityPort } from "./ports/identity.port";
export type { OrganizationPort } from "./ports/organization.port";
export type { AuthWebhookPort } from "./ports/auth-webhook.port";
export type { WalletLinkPort } from "./ports/wallet-link.port";
export type { AuditLogPort } from "./ports/audit-log.port";
export type { NotificationPort } from "./ports/notification.port";
export type { EmailPort } from "./ports/email.port";
export type { KybVerificationPort } from "./ports/kyb-verification.port";
