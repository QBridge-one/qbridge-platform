// ============================================================
// lib/adapters/notification/memory.adapter.ts
// Process-local NotificationPort — dev / preview / unit tests.
// State evaporates on restart; production uses the Drizzle adapter.
// ============================================================

import type {
  ClaimedEmail,
  NotificationListFilter,
  NotificationPort,
} from "../../ports/notification.port";
import type {
  NewNotification,
  Notification,
  PendingEmail,
} from "../../core/notification";

let _seq = 0;
const nextId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

interface OutboxRow extends PendingEmail {
  id: string;
  attempts: number;
  lockedUntil: number | null;
  lastError: string | null;
  sentAt: number | null;
  createdAt: number;
}

class MemoryNotificationAdapter implements NotificationPort {
  private notifications: Notification[] = [];
  private outbox: OutboxRow[] = [];

  // ── In-app feed ───────────────────────────────────────────
  async enqueue(input: NewNotification): Promise<Notification> {
    if (input.dedupeKey != null) {
      const existing = this.notifications.find(
        (n) =>
          n.kind === input.kind &&
          n.orgId === input.orgId &&
          n.userId === input.userId &&
          n.dedupeKey === input.dedupeKey,
      );
      if (existing) return existing;
    }
    const next: Notification = {
      id: nextId("notif"),
      kind: input.kind,
      orgId: input.orgId,
      userId: input.userId,
      title: input.title,
      body: input.body ?? null,
      actionUrl: input.actionUrl ?? null,
      // Payload is typed per-kind via the discriminated union; the
      // memory store just preserves whatever the caller passed.
      payload: input.payload,
      dedupeKey: input.dedupeKey ?? null,
      readAt: null,
      createdAt: Date.now(),
    } as Notification;
    this.notifications.push(next);
    return next;
  }

  async listForUser(
    userId: string,
    filter?: NotificationListFilter,
  ): Promise<Notification[]> {
    let out = this.notifications.filter((n) => n.userId === userId);
    if (filter?.unreadOnly) out = out.filter((n) => n.readAt === null);
    if (filter?.before != null) {
      const before = filter.before;
      out = out.filter((n) => n.createdAt < before);
    }
    out = out
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, Math.min(Math.max(filter?.limit ?? 50, 1), 200));
    return out;
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notifications.filter(
      (n) => n.userId === userId && n.readAt === null,
    ).length;
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    const idx = this.notifications.findIndex(
      (n) => n.id === notificationId && n.userId === userId,
    );
    if (idx === -1) return;
    const n = this.notifications[idx];
    if (n.readAt !== null) return;
    this.notifications[idx] = { ...n, readAt: Date.now() };
  }

  async markAllRead(userId: string): Promise<void> {
    const now = Date.now();
    this.notifications = this.notifications.map((n) =>
      n.userId === userId && n.readAt === null ? { ...n, readAt: now } : n,
    );
  }

  // ── Email outbox ──────────────────────────────────────────
  async enqueueEmail(input: PendingEmail): Promise<void> {
    if (input.dedupeKey != null) {
      const existing = this.outbox.find(
        (r) =>
          r.kind === input.kind &&
          r.toAddress === input.toAddress &&
          r.dedupeKey === input.dedupeKey,
      );
      if (existing) return;
    }
    this.outbox.push({
      ...input,
      id: nextId("outbox"),
      attempts: 0,
      lockedUntil: null,
      lastError: null,
      sentAt: null,
      createdAt: Date.now(),
    });
  }

  async claimPendingEmails(
    limit: number,
    leaseMs: number,
  ): Promise<ClaimedEmail[]> {
    const now = Date.now();
    const claimed: ClaimedEmail[] = [];
    for (const row of this.outbox) {
      if (claimed.length >= limit) break;
      if (row.sentAt !== null) continue;
      if (row.lockedUntil !== null && row.lockedUntil > now) continue;
      row.lockedUntil = now + leaseMs;
      claimed.push({
        id: row.id,
        toAddress: row.toAddress,
        toUserId: row.toUserId,
        orgId: row.orgId,
        kind: row.kind,
        subject: row.subject,
        html: row.html,
        text: row.text,
        dedupeKey: row.dedupeKey,
        payload: row.payload,
        attempts: row.attempts,
        createdAt: row.createdAt,
      });
    }
    return claimed;
  }

  async markEmailSent(outboxId: string): Promise<void> {
    const row = this.outbox.find((r) => r.id === outboxId);
    if (!row) return;
    row.sentAt = Date.now();
    row.lockedUntil = null;
  }

  async markEmailFailed(outboxId: string, error: string): Promise<void> {
    const row = this.outbox.find((r) => r.id === outboxId);
    if (!row) return;
    row.attempts += 1;
    row.lastError = error;
    row.lockedUntil = null;
  }
}

export const memoryNotificationAdapter = new MemoryNotificationAdapter();
