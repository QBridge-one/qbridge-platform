// ============================================================
// lib/adapters/audit-log/drizzle.adapter.ts
// Postgres-backed AuditLogPort. Activated by container.server.ts
// whenever DATABASE_URL is set (memory adapter still used otherwise
// for fresh-clone / no-env dev).
//
// Conventions:
//   - `ts` is stored as timestamptz; the port exposes epoch ms so
//     callers don't bind to a DB dialect. We convert on read/write.
//   - `action` is a free-form text column at the DB level but the
//     port narrows it to AuditAction in core/identity.types.
// ============================================================

import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { auditEntries, type AuditEntryRow } from "../../db/schema";
import type { AuditLogPort } from "../../ports/audit-log.port";
import type { AuditAction, AuditEntry } from "../../core/identity.types";

function rowToEntry(r: AuditEntryRow): AuditEntry {
  return {
    id: r.id,
    orgId: r.orgId,
    actorUserId: r.actorUserId,
    action: r.action as AuditAction,
    target: r.target,
    payload: (r.payload ?? {}) as Record<string, unknown>,
    ts: r.ts.getTime(),
  };
}

class DrizzleAuditLogAdapter implements AuditLogPort {
  async append(
    entry: Omit<AuditEntry, "id" | "ts"> & Partial<Pick<AuditEntry, "id" | "ts">>,
  ): Promise<AuditEntry> {
    const inserted = await db
      .insert(auditEntries)
      .values({
        id: entry.id,
        orgId: entry.orgId,
        actorUserId: entry.actorUserId,
        action: entry.action,
        target: entry.target,
        payload: entry.payload,
        ts: entry.ts != null ? new Date(entry.ts) : undefined,
      })
      .returning();
    return rowToEntry(inserted[0]);
  }

  async list(filter?: {
    orgId?: string | null;
    actorUserId?: string;
    action?: AuditAction;
    limit?: number;
  }): Promise<AuditEntry[]> {
    const conds = [] as ReturnType<typeof eq>[];
    if (filter?.orgId !== undefined) {
      conds.push(
        filter.orgId === null
          ? (sql`${auditEntries.orgId} IS NULL` as unknown as ReturnType<typeof eq>)
          : eq(auditEntries.orgId, filter.orgId),
      );
    }
    if (filter?.actorUserId) conds.push(eq(auditEntries.actorUserId, filter.actorUserId));
    if (filter?.action) conds.push(eq(auditEntries.action, filter.action));

    const limit = Math.min(Math.max(filter?.limit ?? 100, 1), 500);
    const rows = await db
      .select()
      .from(auditEntries)
      .where(conds.length > 0 ? and(...conds) : undefined)
      .orderBy(desc(auditEntries.ts))
      .limit(limit);
    return rows.map(rowToEntry);
  }
}

export const drizzleAuditLogAdapter = new DrizzleAuditLogAdapter();
