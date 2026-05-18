// ============================================================
// lib/core/identity.types.ts
// Domain model types for identity, organizations, invitations.
// Zero dependencies on any IdP (Clerk / WorkOS / Auth0 / Cognito).
// Adapters translate vendor models into these.
// ============================================================

import type { Address } from "./types";
import type {
  IssuerKybApplication,
  IssuerKybReview,
  IssuerKybStatus,
} from "./issuer-kyb";

// ─── Plane ───────────────────────────────────────────────────
// Two distinct planes of access in QBridge.
// "ops"        → QBridge internal team (PlatformAccessManager)
// "issuer"     → Issuer workspace (TokenAccessManager)
export type OrgKind = "ops" | "issuer";

// ─── App-level (off-chain) roles ─────────────────────────────
// These are dashboard / UI / API gates only. They NEVER grant
// on-chain authority. Chain authority is enforced by AccessManager.
//
// A user holds a SET of these roles per org (see OrgMember.appRoles).
// Permissions union the role-policies. Vendor role names map to these.
//
// Naming convention: "<plane>_<function>". Two reserved tokens:
//   - "<plane>_admin"  : full admin of that plane
//   - "<plane>_member" : minimal authenticated baseline (read-only)
export type AppRole =
  // ── Issuer plane (per-issuer workspace) ──
  | "issuer_admin"
  | "issuer_compliance"        // Compliance Officer (CCO/Compliance)
  | "issuer_dealer"            // Dealing Representative (DR / sales)
  | "issuer_operations"        // Operations / cap-table / distributions
  | "issuer_property_manager"  // Asset / property manager (real-estate)
  | "issuer_auditor"           // Read-only auditor / external review
  | "issuer_member"            // Baseline read-only member
  // ── Ops plane (QBridge platform team) ──
  | "ops_admin"
  | "ops_compliance"           // Platform CCO
  | "ops_onboarding"           // Issuer onboarding / KYB review
  | "ops_support"              // Investor / issuer support (read-only)
  | "ops_engineer"             // Platform engineering / contracts deploy
  | "ops_member";              // Baseline read-only member

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  issuer_admin: "Workspace Admin",
  issuer_compliance: "Compliance Officer",
  issuer_dealer: "Dealing Representative",
  issuer_operations: "Operations",
  issuer_property_manager: "Property Manager",
  issuer_auditor: "Auditor",
  issuer_member: "Workspace Member",
  ops_admin: "Ops Admin",
  ops_compliance: "Platform Compliance",
  ops_onboarding: "Issuer Onboarding",
  ops_support: "Support",
  ops_engineer: "Engineering",
  ops_member: "Ops Member",
};

/** Set of valid AppRole strings — useful for runtime validation when
 *  reading vendor metadata (which is `unknown`). */
export const APP_ROLES: readonly AppRole[] = Object.keys(APP_ROLE_LABELS) as AppRole[];

/** Type guard: is `v` a known AppRole? */
export function isAppRole(v: unknown): v is AppRole {
  return typeof v === "string" && (APP_ROLES as readonly string[]).includes(v);
}

/** Plane that an AppRole belongs to. */
export function planeOfRole(role: AppRole): OrgKind {
  return role.startsWith("ops_") ? "ops" : "issuer";
}

// ─── User ────────────────────────────────────────────────────
export interface AppUser {
  /** Stable internal user id (mapped from IdP user id). */
  id: string;
  /** Vendor-specific id. Adapters set this; app code should not parse it. */
  authUserId: string;
  email: string;
  displayName: string | null;
  imageUrl: string | null;
  /** Wallet address linked + verified by signature. Null if not linked. */
  primaryWallet: Address | null;
  createdAt: string;
}

// ─── Organization ────────────────────────────────────────────
export interface AppOrg {
  id: string;
  authOrgId: string;
  name: string;
  slug: string;
  kind: OrgKind;
  /** Optional issuer linkage (issuer registry / KYB record id). */
  issuerId: string | null;
  /** Issuer org only: KYB onboarding state sourced from Clerk org publicMetadata.kybStatus. Null for ops workspaces. */
  kybStatus: IssuerKybStatus | null;
  /** Snapshot of last submission (issuer org); null until first submit or if cleared. */
  kybApplication: IssuerKybApplication | null;
  /** Latest decision metadata (approved/rejected, reviewer, reason). Null
   *  while pending or before any decision has been recorded. */
  kybReview: IssuerKybReview | null;
  createdAt: string;
}

// ─── Membership ──────────────────────────────────────────────
export type MemberStatus = "active" | "invited" | "suspended";

export interface OrgMember {
  userId: string;
  orgId: string;
  email: string;
  displayName: string | null;
  imageUrl: string | null;
  /** Source of truth: the full set of off-chain roles this member holds
   *  in this org. Always non-empty for an active member (baseline at
   *  minimum). Permissions are unioned across the set. */
  appRoles: AppRole[];
  /** @deprecated Use `appRoles`. Equals `appRoles[0]` for back-compat
   *  with older call sites. New code should not write this directly. */
  appRole: AppRole;
  status: MemberStatus;
  walletAddress: Address | null;
  joinedAt: string;
  lastActiveAt: string | null;
}

// ─── Invite ──────────────────────────────────────────────────
export interface InviteInput {
  email: string;
  /** Primary role granted on accept (becomes `appRoles[0]`). */
  appRole: AppRole;
  /** Optional additional roles granted on accept. The persisted
   *  member's `appRoles` will be `[appRole, ...appRoles]` deduped. */
  appRoles?: AppRole[];
  /** Optional callback URL the IdP routes to after accept. */
  redirectUrl?: string;
}

export interface Invite {
  id: string;
  orgId: string;
  email: string;
  /** Primary role granted on accept. Mirrored from InviteInput. */
  appRole: AppRole;
  /** Optional richer role set granted on accept. */
  appRoles?: AppRole[];
  status: "pending" | "accepted" | "revoked" | "expired";
  invitedBy: string; // user id
  createdAt: string;
  acceptedAt: string | null;
}

// ─── Session ─────────────────────────────────────────────────
export interface AppSession {
  user: AppUser;
  /** The organization currently active for this session (null = none). */
  activeOrg: AppOrg | null;
  /** App roles held in the active org. Empty array = no membership.
   *  Source of truth: prefer this over `appRole`. */
  appRoles: AppRole[];
  /** @deprecated Use `appRoles`. Equals `appRoles[0] ?? null`. */
  appRole: AppRole | null;
}

// ─── Auth events (webhooks) ──────────────────────────────────
export type AuthEventType =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "org.created"
  | "org.updated"
  | "org.deleted"
  | "membership.created"
  | "membership.updated"
  | "membership.deleted"
  | "invite.created"
  | "invite.accepted"
  | "invite.revoked";

export interface AuthEvent<T = unknown> {
  type: AuthEventType;
  payload: T;
  /** Vendor event id, used for idempotency. */
  eventId: string;
  timestamp: number;
}

// ─── Wallet linking ──────────────────────────────────────────
export interface WalletLinkChallenge {
  nonce: string;
  /** Message the user must sign — includes nonce + domain + statement. */
  message: string;
  expiresAt: number;
}

export interface WalletLinkProof {
  userId: string;
  address: Address;
  signature: `0x${string}`;
  nonce: string;
}

// ─── Audit log ───────────────────────────────────────────────
export type AuditAction =
  | "invite.sent"
  | "invite.revoked"
  | "member.role_changed"
  | "member.removed"
  | "wallet.linked"
  | "wallet.unlinked"
  | "chain_role.granted"
  | "chain_role.revoked"
  | "kyb.submitted"
  | "kyb.approved"
  | "kyb.rejected"
  | "ops.action";

export interface AuditEntry {
  id: string;
  orgId: string | null;
  actorUserId: string;
  action: AuditAction;
  target: string | null;
  payload: Record<string, unknown>;
  ts: number;
}
