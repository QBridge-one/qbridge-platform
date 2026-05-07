// ============================================================
// lib/adapters/audit-log/memory.adapter.ts
// Process-local audit log. Replace with DB-backed adapter later.
// ============================================================

import type { AuditLogPort } from "../../ports/audit-log.port";
import type { AuditEntry } from "../../core/identity.types";

class MemoryAuditLogAdapter implements AuditLogPort {
  private entries: AuditEntry[] = [];
  private seq = 0;

  async append(
    entry: Omit<AuditEntry, "id" | "ts"> & Partial<Pick<AuditEntry, "id" | "ts">>,
  ): Promise<AuditEntry> {
    const full: AuditEntry = {
      id: entry.id ?? `audit_${Date.now().toString(36)}_${(this.seq++).toString(36)}`,
      ts: entry.ts ?? Date.now(),
      orgId: entry.orgId,
      actorUserId: entry.actorUserId,
      action: entry.action,
      target: entry.target,
      payload: entry.payload,
    };
    this.entries.push(full);
    return full;
  }

  async list(filter?: {
    orgId?: string | null;
    actorUserId?: string;
    action?: AuditEntry["action"];
    limit?: number;
  }): Promise<AuditEntry[]> {
    let out = this.entries;
    if (filter?.orgId !== undefined) out = out.filter((e) => e.orgId === filter.orgId);
    if (filter?.actorUserId) out = out.filter((e) => e.actorUserId === filter.actorUserId);
    if (filter?.action) out = out.filter((e) => e.action === filter.action);
    out = out.slice().sort((a, b) => b.ts - a.ts);
    if (filter?.limit) out = out.slice(0, filter.limit);
    return out;
  }
}

export const memoryAuditLogAdapter = new MemoryAuditLogAdapter();
