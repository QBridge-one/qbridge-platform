// ============================================================
// lib/adapters/notification/drizzle.adapter.ts
// Postgres-backed NotificationPort.
//
// Two tables: `notifications` (in-app feed) + `notification_outbox`
// (pending emails). Both share the same dedupe semantics via the
// partial-unique index `(kind, org_id, user_id, dedupe_key)` /
// `(channel, kind, to_address, dedupe_key)` defined in schema.ts —
// when `dedupeKey` is supplied, re-inserts silently no-op.
//
// Worker leasing (`claimPendingEmails`) uses `FOR UPDATE SKIP LOCKED`
// inside a transaction to let multiple dispatchers run safely.
// ============================================================

import "server-only";

import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  notifications,
  notificationOutbox,
  type NotificationOutboxRow,
  type NotificationRow,
} from "../../db/schema";
import type {
  ClaimedEmail,
  NotificationListFilter,
  NotificationPort,
} from "../../ports/notification.port";
import type {
  NewNotification,
  Notification,
  NotificationKind,
  PendingEmail,
} from "../../core/notification";

function rowToNotification(r: NotificationRow): Notification {
  return {
    id: r.id,
    kind: r.kind as NotificationKind,
    orgId: r.orgId,
    userId: r.userId,
    title: r.title,
    body: r.body,
    actionUrl: r.actionUrl,
    payload: (r.payload ?? {}) as Notification["payload"],
    dedupeKey: r.dedupeKey,
    readAt: r.readAt ? r.readAt.getTime() : null,
    createdAt: r.createdAt.getTime(),
  } as Notification;
}

function rowToClaimedEmail(r: NotificationOutboxRow): ClaimedEmail {
  return {
    id: r.id,
    toAddress: r.toAddress,
    toUserId: r.toUserId,
    orgId: r.orgId,
    kind: r.kind as NotificationKind,
    subject: r.subject,
    html: r.html,
    text: r.textBody,
    dedupeKey: r.dedupeKey,
    payload: (r.payload ?? {}) as Record<string, unknown>,
    attempts: r.attempts,
    createdAt: r.createdAt.getTime(),
  };
}

class DrizzleNotificationAdapter implements NotificationPort {
  // ── In-app feed ───────────────────────────────────────────
  async enqueue(input: NewNotification): Promise<Notification> {
    // Insert with ON CONFLICT DO NOTHING. The partial-unique index
    // only fires when dedupeKey is provided; without one, every
    // insert succeeds (UUID PK keeps rows distinct).
    const inserted = await db
      .insert(notifications)
      .values({
        kind: input.kind,
        orgId: input.orgId,
        userId: input.userId,
        title: input.title,
        body: input.body ?? null,
        actionUrl: input.actionUrl ?? null,
        payload: input.payload as Record<string, unknown>,
        dedupeKey: input.dedupeKey ?? null,
      })
      .onConflictDoNothing({
        target: [
          notifications.kind,
          notifications.orgId,
          notifications.userId,
          notifications.dedupeKey,
        ],
        where: sql`dedupe_key IS NOT NULL`,
      })
      .returning();

    if (inserted.length > 0) return rowToNotification(inserted[0]);

    // Conflict path — fetch the existing row (only reachable when
    // dedupeKey is non-null, since otherwise the insert succeeds).
    const existing = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.kind, input.kind),
          eq(notifications.orgId, input.orgId),
          eq(notifications.userId, input.userId),
          eq(notifications.dedupeKey, input.dedupeKey!),
        ),
      )
      .limit(1);
    if (existing.length === 0) {
      throw new Error(
        "DrizzleNotificationAdapter.enqueue: conflict path returned no row",
      );
    }
    return rowToNotification(existing[0]);
  }

  async listForUser(
    userId: string,
    filter?: NotificationListFilter,
  ): Promise<Notification[]> {
    const conds = [eq(notifications.userId, userId)];
    if (filter?.unreadOnly) conds.push(isNull(notifications.readAt));
    if (filter?.before != null) {
      conds.push(lt(notifications.createdAt, new Date(filter.before)));
    }
    const limit = Math.min(Math.max(filter?.limit ?? 50, 1), 200);
    const rows = await db
      .select()
      .from(notifications)
      .where(and(...conds))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return rows.map(rowToNotification);
  }

  async unreadCount(userId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt)),
      );
    return row?.count ?? 0;
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
          isNull(notifications.readAt),
        ),
      );
  }

  async markAllRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt)),
      );
  }

  // ── Email outbox ──────────────────────────────────────────
  async enqueueEmail(input: PendingEmail): Promise<void> {
    await db
      .insert(notificationOutbox)
      .values({
        channel: "email",
        kind: input.kind,
        toAddress: input.toAddress,
        toUserId: input.toUserId,
        orgId: input.orgId,
        subject: input.subject,
        html: input.html,
        textBody: input.text,
        payload: input.payload,
        dedupeKey: input.dedupeKey,
      })
      .onConflictDoNothing({
        target: [
          notificationOutbox.channel,
          notificationOutbox.kind,
          notificationOutbox.toAddress,
          notificationOutbox.dedupeKey,
        ],
        where: sql`dedupe_key IS NOT NULL`,
      });
  }

  async claimPendingEmails(
    limit: number,
    leaseMs: number,
  ): Promise<ClaimedEmail[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    // Interpolate as ISO strings + ::timestamptz cast. The Drizzle sql
    // template ships JS values to postgres-js without column-type
    // context, and postgres-js calls Date.toString() — which yields
    // "Mon May 18 2026 12:09:20 GMT-0400 (EDT)" and breaks parse.
    const nowIso = new Date().toISOString();
    const leaseUntilIso = new Date(Date.now() + leaseMs).toISOString();

    // Lease available rows in a single statement via a CTE + UPDATE.
    // SKIP LOCKED makes this safe to run from multiple dispatchers.
    const rows = await db.execute(sql`
      WITH leased AS (
        SELECT id FROM notification_outbox
        WHERE sent_at IS NULL
          AND (locked_until IS NULL OR locked_until <= ${nowIso}::timestamptz)
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${safeLimit}
      )
      UPDATE notification_outbox o
      SET locked_until = ${leaseUntilIso}::timestamptz
      FROM leased
      WHERE o.id = leased.id
      RETURNING o.*
    `);

    // postgres-js returns an array-like of plain objects; coerce.
    const list = (rows as unknown as Record<string, unknown>[]) ?? [];
    return list.map((raw) => {
      const r: NotificationOutboxRow = {
        id: raw.id as string,
        channel: raw.channel as string,
        kind: raw.kind as string,
        toAddress: raw.to_address as string,
        toUserId: (raw.to_user_id as string | null) ?? null,
        orgId: (raw.org_id as string | null) ?? null,
        subject: raw.subject as string,
        html: raw.html as string,
        textBody: (raw.text_body as string | null) ?? null,
        payload: (raw.payload as Record<string, unknown>) ?? {},
        dedupeKey: (raw.dedupe_key as string | null) ?? null,
        attempts: raw.attempts as number,
        lockedUntil: raw.locked_until ? new Date(raw.locked_until as string) : null,
        lastError: (raw.last_error as string | null) ?? null,
        sentAt: raw.sent_at ? new Date(raw.sent_at as string) : null,
        createdAt: new Date(raw.created_at as string),
      };
      return rowToClaimedEmail(r);
    });
  }

  async markEmailSent(outboxId: string): Promise<void> {
    await db
      .update(notificationOutbox)
      .set({ sentAt: new Date(), lockedUntil: null, lastError: null })
      .where(eq(notificationOutbox.id, outboxId));
  }

  async markEmailFailed(outboxId: string, error: string): Promise<void> {
    await db
      .update(notificationOutbox)
      .set({
        lockedUntil: null,
        lastError: error.slice(0, 4000),
        attempts: sql`${notificationOutbox.attempts} + 1`,
      })
      .where(eq(notificationOutbox.id, outboxId));
  }
}

export const drizzleNotificationAdapter = new DrizzleNotificationAdapter();
