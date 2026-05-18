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
export type NotificationKind =
  | "issuer.kyb_submitted"
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
