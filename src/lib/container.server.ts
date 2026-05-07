// ============================================================
// lib/container.server.ts
// Server-only DI for identity / org / auth-webhook / wallet-link /
// audit-log adapters. Imported by route handlers, server components,
// services, and middleware. NEVER import from a client component.
//
// To swap Clerk → WorkOS:
//   1. add adapters under src/lib/adapters/{identity,organization,…}/workos.adapter.ts
//   2. extend the IDENTITY_PROVIDER switch below
//   3. nothing else changes.
// ============================================================

import "server-only";

import { memoryIdentityAdapter } from "./adapters/identity/memory.adapter";
import { clerkIdentityAdapter } from "./adapters/identity/clerk.adapter";
import { memoryOrganizationAdapter } from "./adapters/organization/memory.adapter";
import { clerkOrganizationAdapter } from "./adapters/organization/clerk.adapter";
import { memoryAuthWebhookAdapter } from "./adapters/auth-webhook/memory.adapter";
import { clerkAuthWebhookAdapter } from "./adapters/auth-webhook/clerk.adapter";
import { memoryWalletLinkAdapter } from "./adapters/wallet-link/memory.adapter";
import { memoryAuditLogAdapter } from "./adapters/audit-log/memory.adapter";

// Identity provider switch — env-driven so the same build can run
// against memory (dev) or Clerk (prod) without recompiling.
//   IDENTITY_PROVIDER=memory  → in-process store, no IdP required
//   IDENTITY_PROVIDER=clerk   → Clerk SDK (requires CLERK_* env vars)
const IDENTITY_PROVIDER = (process.env.IDENTITY_PROVIDER ?? "memory").toLowerCase();

export const identityAdapter =
  IDENTITY_PROVIDER === "clerk" ? clerkIdentityAdapter : memoryIdentityAdapter;

export const organizationAdapter =
  IDENTITY_PROVIDER === "clerk" ? clerkOrganizationAdapter : memoryOrganizationAdapter;

export const authWebhookAdapter =
  IDENTITY_PROVIDER === "clerk" ? clerkAuthWebhookAdapter : memoryAuthWebhookAdapter;

export const walletLinkAdapter = memoryWalletLinkAdapter;
export const auditLogAdapter = memoryAuditLogAdapter;

export type { IdentityPort } from "./ports/identity.port";
export type { OrganizationPort } from "./ports/organization.port";
export type { AuthWebhookPort } from "./ports/auth-webhook.port";
export type { WalletLinkPort } from "./ports/wallet-link.port";
export type { AuditLogPort } from "./ports/audit-log.port";
