// ============================================================
// lib/core/notification.ts
// Domain types for multi-tenant notifications.
//
// A Notification is a per-recipient row: the same business event
// (e.g. "issuer.kyb_submitted") fans out to N rows, one per
// member who should see it. Recipient resolution happens in the
// notification service (role + plane filter on OrganizationPort).
//
// Tenancy:
//   - `orgId` is the org the notification is ABOUT (e.g. the
//     issuer org for KYB events). Ops members get rows tagged
//     with the issuer org so the ops queue can filter by it.
//   - `userId` is the RECIPIENT (always set — fanout is denormalized).
//
// Adding a new kind: extend NotificationKind + NotificationPayloads,
// add a render function in services/notification.service.ts, add a
// recipient rule in the service's kind→roles map.
// ============================================================

import type { AppRole, OrgKind } from "./identity.types";

// ─── Kinds ─────────────────────────────────────────────────
// Naming: "<subject>.<event>". Stays stable across releases; the
// notification renderer in the service maps kind → title/body.
//
// The issuer onboarding journey produces three distinct gate events:
//   1. Application gate (ops decides on the form)
//        application_approved | application_rejected → issuer admin
//   2. Identity-verification gate (Sumsub/Persona webhook)
//        kyb_verified  → OPS (signal to do on-chain registration)
//        kyb_failed    → issuer admin
//   3. On-chain gate (ops calls verifyIssuer on IssuerRegistry)
//        workspace_active → issuer admin (fully unlocked, can tokenize)
//
// The legacy `kyb_approved`/`kyb_rejected` kinds are kept so old
// notifications in the DB still render; new events use the split kinds.
export type NotificationKind =
  | "issuer.kyb_submitted"
  | "issuer.application_approved"
  | "issuer.application_rejected"
  | "issuer.kyb_verified"
  | "issuer.kyb_failed"
  | "issuer.workspace_active"
  | "issuer.kyb_approved"
  | "issuer.kyb_rejected";

// ─── Typed payloads per kind ───────────────────────────────
// The payload is what the renderer uses to format title/body and
// what the UI uses to deep-link. Keep it small and stable; large
// blobs belong elsewhere (the audit log, the org record).
export interface NotificationPayloads {
  "issuer.kyb_submitted": {
    issuerOrgId: string;
    issuerOrgName: string;
    legalEntityName: string;
    jurisdiction: string;
    submittedByUserId: string;
    submittedAt: string;
  };
  // ── Step 1 — application gate (ops decides on the form) ──
  "issuer.application_approved": {
    issuerOrgId: string;
    issuerOrgName: string;
    decidedByUserId: string;
    decidedAt: string;
  };
  "issuer.application_rejected": {
    issuerOrgId: string;
    issuerOrgName: string;
    decidedByUserId: string;
    decidedAt: string;
    reason: string | null;
  };
  // ── Step 2A — identity verification gate (Sumsub / Persona webhook) ──
  /** Sumsub GREEN — fires to OPS, prompts on-chain registration. */
  "issuer.kyb_verified": {
    issuerOrgId: string;
    issuerOrgName: string;
    provider: "persona" | "sumsub" | "manual";
    caseId: string;
    verifiedAt: string;
  };
  /** Sumsub RED — fires to the issuer admin, prompt to retry. */
  "issuer.kyb_failed": {
    issuerOrgId: string;
    issuerOrgName: string;
    provider: "persona" | "sumsub" | "manual";
    caseId: string;
    failedAt: string;
    reason: string | null;
  };
  // ── Step 2B — on-chain gate (ops calls IssuerRegistry.verifyIssuer) ──
  /** Final unlock — fires to the issuer admin after the on-chain tx
   *  confirms. From this point the issuer can deploy tokens. */
  "issuer.workspace_active": {
    issuerOrgId: string;
    issuerOrgName: string;
    registeredByUserId: string;
    registeredAt: string;
    txHash: string;
    chainId: number;
  };
  // ── Legacy (preserved so old DB rows still render) ──
  "issuer.kyb_approved": {
    issuerOrgId: string;
    issuerOrgName: string;
    decidedByUserId: string;
    decidedAt: string;
  };
  "issuer.kyb_rejected": {
    issuerOrgId: string;
    issuerOrgName: string;
    decidedByUserId: string;
    decidedAt: string;
    reason: string | null;
  };
}

// ─── Discriminated union ───────────────────────────────────
type NotificationOf<K extends NotificationKind> = {
  id: string;
  kind: K;
  /** Org this notification is ABOUT (issuer org for kyb.*). */
  orgId: string;
  /** Recipient user id (one row per recipient). */
  userId: string;
  title: string;
  body: string | null;
  /** In-app deep link (e.g. /ops/admin/issuers/<id>). */
  actionUrl: string | null;
  payload: NotificationPayloads[K];
  /** Optional collision key; with (kind, orgId, userId) it forms a
   *  partial-unique index that prevents duplicate fanout when an
   *  event is emitted by both the UI path and the webhook backup. */
  dedupeKey: string | null;
  readAt: number | null;
  createdAt: number;
};

export type Notification =
  | NotificationOf<"issuer.kyb_submitted">
  | NotificationOf<"issuer.application_approved">
  | NotificationOf<"issuer.application_rejected">
  | NotificationOf<"issuer.kyb_verified">
  | NotificationOf<"issuer.kyb_failed">
  | NotificationOf<"issuer.workspace_active">
  | NotificationOf<"issuer.kyb_approved">
  | NotificationOf<"issuer.kyb_rejected">;

// ─── Write-side input ──────────────────────────────────────
export type NewNotification = {
  [K in NotificationKind]: {
    kind: K;
    orgId: string;
    userId: string;
    title: string;
    body?: string | null;
    actionUrl?: string | null;
    payload: NotificationPayloads[K];
    dedupeKey?: string | null;
  };
}[NotificationKind];

// ─── Recipient rule ────────────────────────────────────────
// Service-level concept (not stored): "fan out to members of this
// org whose role-set intersects `roles`". The service resolves the
// rule into concrete user ids via OrganizationPort.listMembers.
export interface RecipientRule {
  orgId: string;
  plane: OrgKind;
  /** Any member whose appRoles intersects this set is a recipient. */
  roles: AppRole[];
}

// ─── Email channel (mirrors EmailPort.send input) ──────────
// Captured into the outbox so a dispatcher can retry independently
// of whether the in-app row was written.
export interface PendingEmail {
  toAddress: string;
  toUserId: string | null;
  orgId: string | null;
  kind: NotificationKind;
  subject: string;
  html: string;
  text: string | null;
  /** Same shape/role as Notification.dedupeKey. */
  dedupeKey: string | null;
  /** Free-form payload tags (e.g. for Resend tagging). */
  payload: Record<string, unknown>;
}
