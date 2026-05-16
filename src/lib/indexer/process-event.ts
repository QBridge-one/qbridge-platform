// ============================================================
// lib/indexer/process-event.ts
//
// Translates a decoded AccessManager event into DB writes. Two
// tables get touched in lockstep:
//
//   1. role_assignment_events  → append-only log of EVERY event.
//      The (am, txHash, logIndex) unique index makes replays idempotent
//      so backfill + watch can race without producing duplicates.
//
//   2. role_assignments        → materialized current state. Updated
//      on grant (upsert) / revoke (delete). Cheap reads for the UI.
//
// Both writes happen inside one transaction per event so the event
// log can never disagree with the materialized state.
// ============================================================

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { roleAssignments, roleAssignmentEvents } from "@/lib/db/schema";
import type { Log } from "viem";
import { decodeEventLog } from "viem";
import { ACCESS_MANAGER_EVENTS } from "./abi";

interface EventCtx {
  /** access_managers.id (UUID) for the AM that emitted this log. */
  accessManagerId: string;
  /** Block timestamp in unix seconds — fetched once per block by the caller. */
  blockTimestampSec: number;
  /** Optional: tx originator, if the indexer enriched it. */
  byAccount?: string;
}

function normalizeAddress(addr: string): string {
  return addr.toLowerCase();
}

/** Process one Log. Safe to call many times for the same log — the
 *  unique index on role_assignment_events makes the insert a no-op,
 *  and the upsert/delete on role_assignments converges to the same
 *  state regardless of order (because we only act on the event's own
 *  facts: grant always replaces, revoke always removes). */
export async function processLog(log: Log, ctx: EventCtx): Promise<void> {
  // Decode the event using our scoped ABI. Anything we don't recognize
  // is silently skipped — the AM emits more events than we care about.
  let decoded:
    | ReturnType<typeof decodeEventLog<typeof ACCESS_MANAGER_EVENTS>>
    | null = null;
  try {
    decoded = decodeEventLog({
      abi: ACCESS_MANAGER_EVENTS,
      data: log.data,
      topics: log.topics,
    });
  } catch {
    return;
  }
  if (!decoded) return;
  const blockTs = new Date(ctx.blockTimestampSec * 1000);

  // Common payload for the append-only log table.
  const logRowBase = {
    accessManagerId: ctx.accessManagerId,
    blockNumber: log.blockNumber!,
    blockTimestamp: blockTs,
    txHash: log.transactionHash!,
    logIndex: log.logIndex!,
    byAccount: ctx.byAccount ?? null,
  } as const;

  await db.transaction(async (tx) => {
    // Narrow off `decoded.eventName` so `decoded.args` gets the right
    // shape per event — TS discriminated-union narrowing.
    if (decoded.eventName === "RoleGranted") {
      const { roleId, account, delay, since, newMember } = decoded.args;
      const acct = normalizeAddress(account);

      await tx
        .insert(roleAssignmentEvents)
        .values({
          ...logRowBase,
          roleId,
          account: acct,
          kind: "granted",
          extra: { delay: Number(delay), since: Number(since), newMember },
        })
        .onConflictDoNothing();

      // Materialized state: upsert. Re-grants of the same (role, account)
      // can change executionDelay, so we replace the row outright.
      await tx
        .insert(roleAssignments)
        .values({
          accessManagerId: ctx.accessManagerId,
          roleId,
          account: acct,
          executionDelay: Number(delay),
          grantedAt: blockTs,
          grantedBlock: log.blockNumber!,
          grantedTxHash: log.transactionHash!,
          grantedBy: ctx.byAccount ?? "0x",
        })
        .onConflictDoUpdate({
          target: [
            roleAssignments.accessManagerId,
            roleAssignments.roleId,
            roleAssignments.account,
          ],
          set: {
            executionDelay: Number(delay),
            grantedAt: blockTs,
            grantedBlock: log.blockNumber!,
            grantedTxHash: log.transactionHash!,
            grantedBy: ctx.byAccount ?? sql`${roleAssignments.grantedBy}`,
          },
        });
      return;
    }

    if (decoded.eventName === "RoleRevoked") {
      const { roleId, account } = decoded.args;
      const acct = normalizeAddress(account);

      await tx
        .insert(roleAssignmentEvents)
        .values({ ...logRowBase, roleId, account: acct, kind: "revoked" })
        .onConflictDoNothing();

      await tx
        .delete(roleAssignments)
        .where(
          and(
            eq(roleAssignments.accessManagerId, ctx.accessManagerId),
            eq(roleAssignments.roleId, roleId),
            eq(roleAssignments.account, acct),
          ),
        );
      return;
    }

    if (decoded.eventName === "RoleAdminChanged") {
      const { roleId, admin } = decoded.args;
      await tx
        .insert(roleAssignmentEvents)
        .values({
          ...logRowBase,
          roleId,
          // role_admin_changed isn't account-scoped; "0x" keeps the
          // (am, tx, log) idempotency key well-defined.
          account: "0x",
          kind: "role_admin_changed",
          extra: { newAdminRoleId: admin.toString() },
        })
        .onConflictDoNothing();
      return;
    }

    if (decoded.eventName === "RoleGrantDelayChanged") {
      const { roleId, delay, since } = decoded.args;
      await tx
        .insert(roleAssignmentEvents)
        .values({
          ...logRowBase,
          roleId,
          account: "0x",
          kind: "role_grant_delay_changed",
          extra: { delay: Number(delay), since: Number(since) },
        })
        .onConflictDoNothing();
      return;
    }
  });
}
