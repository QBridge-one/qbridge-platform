// ============================================================
// lib/ports/notification.port.ts
// In-app notification feed + email outbox.
//
// Implemented by:
//   - MemoryNotificationAdapter  (tests / dev fixture)
//   - DrizzleNotificationAdapter (Postgres, prod)
//
// Two responsibilities behind one port:
//   1. The user-visible feed (`enqueue`, `listForUser`, `markRead`,
//      `unreadCount`) — what the bell dropdown reads.
//   2. The email outbox (`enqueueEmail`, `claimPendingEmails`,
//      `markEmailSent`, `markEmailFailed`) — what a dispatcher
//      consumes to call EmailPort.send().
//
// Both halves share a transactional path in the Drizzle adapter so
// `services/notification.service.ts` can insert in-app rows + outbox
// rows atomically with the calling service's state change.
// ============================================================

import type { Notification, NewNotification, PendingEmail } from "../core/notification";

export interface NotificationListFilter {
  unreadOnly?: boolean;
  /** Page size, default 50, hard-cap 200. */
  limit?: number;
  /** Cursor: only rows whose `createdAt` is strictly older than this (ms). */
  before?: number;
}

export interface ClaimedEmail extends PendingEmail {
  id: string;
  attempts: number;
  createdAt: number;
}

export interface NotificationPort {
  // ── In-app feed ───────────────────────────────────────────
  /** Insert a single notification row. Returns the persisted entity.
   *  Respects (kind, orgId, userId, dedupeKey) partial unique — when
   *  a duplicate is detected, the existing row is returned (idempotent). */
  enqueue(input: NewNotification): Promise<Notification>;
  listForUser(userId: string, filter?: NotificationListFilter): Promise<Notification[]>;
  unreadCount(userId: string): Promise<number>;
  markRead(userId: string, notificationId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;

  // ── Email outbox ──────────────────────────────────────────
  /** Insert a pending email row. Same dedupe semantics as enqueue. */
  enqueueEmail(input: PendingEmail): Promise<void>;
  /** Atomically lease up to `limit` unsent rows for `leaseMs` ms.
   *  Concurrent dispatchers won't see each other's leased rows. */
  claimPendingEmails(limit: number, leaseMs: number): Promise<ClaimedEmail[]>;
  markEmailSent(outboxId: string): Promise<void>;
  markEmailFailed(outboxId: string, error: string): Promise<void>;
}
