// ============================================================
// lib/ports/audit-log.port.ts
// Append-only audit trail for off-chain actions (invites, role
// changes, wallet links, ops actions). On-chain events come from
// blockchainPort.getLogs separately and may be stitched in by a
// reporting service.
// ============================================================

import type { AuditEntry } from "../core/identity.types";

export interface AuditLogPort {
  append(entry: Omit<AuditEntry, "id" | "ts"> & Partial<Pick<AuditEntry, "id" | "ts">>): Promise<AuditEntry>;
  list(filter?: {
    orgId?: string | null;
    actorUserId?: string;
    action?: AuditEntry["action"];
    limit?: number;
  }): Promise<AuditEntry[]>;
}
