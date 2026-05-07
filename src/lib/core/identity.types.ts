// ============================================================
// lib/core/identity.types.ts
// Domain model types for identity, organizations, invitations.
// Zero dependencies on any IdP (Clerk / WorkOS / Auth0 / Cognito).
// Adapters translate vendor models into these.
// ============================================================

import type { Address } from "./types";

// ─── Plane ───────────────────────────────────────────────────
// Two distinct planes of access in QBridge.
// "ops"        → QBridge internal team (PlatformAccessManager)
// "issuer"     → Issuer workspace (TokenAccessManager)
export type OrgKind = "ops" | "issuer";

// ─── App-level (off-chain) roles ─────────────────────────────
// These are dashboard / UI / API gates only. They NEVER grant
// on-chain authority. Chain authority is enforced by AccessManager.
//
// Keep this list short and stable; vendor role names map to these.
export type AppRole =
  | "ops_admin"
  | "ops_member"
  | "issuer_admin"
  | "issuer_member";

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  ops_admin: "Ops Admin",
  ops_member: "Ops Member",
  issuer_admin: "Workspace Admin",
  issuer_member: "Workspace Member",
};

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
  appRole: AppRole;
  status: MemberStatus;
  walletAddress: Address | null;
  joinedAt: string;
  lastActiveAt: string | null;
}

// ─── Invite ──────────────────────────────────────────────────
export interface InviteInput {
  email: string;
  appRole: AppRole;
  /** Optional callback URL the IdP routes to after accept. */
  redirectUrl?: string;
}

export interface Invite {
  id: string;
  orgId: string;
  email: string;
  appRole: AppRole;
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
  /** App role within the active org (null = no membership). */
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
