// ============================================================
// lib/db/schema.ts — Drizzle schema for the chain-role indexer DB.
//
// Tables capture the CURRENT STATE of on-chain role grants
// (role_assignments) plus an APPEND-ONLY LOG of every grant /
// revoke event (role_assignment_events). The indexer keeps a
// per-chain cursor so it can resume after restart.
//
// Conventions:
//   - All EVM addresses stored as lowercase 0x-prefixed `text`
//     (citext would be nicer, but keeping zero extensions for
//     portability across hosted Postgres providers). Normalize
//     on the write path.
//   - Block numbers and role IDs are uint64 on chain → `bigint`
//     here (drizzle returns these as JS bigint, NOT number).
//   - One row per access manager in `access_managers`; rows in
//     other tables FK to it so cascade cleanup works.
// ============================================================

import {
  pgTable,
  uuid,
  integer,
  bigint,
  text,
  timestamp,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── AccessManagers ────────────────────────────────────────────
// One row per deployed AM (platform OR per-token). The indexer
// pulls from this table to decide which addresses to watch.

export const accessManagers = pgTable(
  "access_managers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chainId: integer("chain_id").notNull(),
    /** Lowercased 0x… */
    amAddress: text("am_address").notNull(),
    /** "platform" → one per chain; "token" → many per chain. */
    kind: text("kind", { enum: ["platform", "token"] }).notNull(),
    /** Clerk org id. For platform AM = the ops org id. For token AM
     *  = the issuer org that deployed the token. */
    orgId: text("org_id").notNull(),
    /** Asset id this AM governs. Null for platform AMs. */
    assetId: text("asset_id"),
    /** Block the AM was deployed at — backfill starts here. */
    deployedBlock: bigint("deployed_block", { mode: "bigint" }).notNull(),
    deployedAt: timestamp("deployed_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("am_chain_addr_uq").on(t.chainId, t.amAddress),
    index("am_org_kind_idx").on(t.orgId, t.kind),
    index("am_asset_idx").on(t.assetId),
  ],
);

// ─── Current role assignments (materialized state) ─────────────
// Source of truth for "does wallet X hold role R on AM Y?".
// The indexer maintains this by reacting to RoleGranted /
// RoleRevoked / RoleAdminChanged events.

export const roleAssignments = pgTable(
  "role_assignments",
  {
    accessManagerId: uuid("access_manager_id")
      .notNull()
      .references(() => accessManagers.id, { onDelete: "cascade" }),
    /** uint64 role ID (OZ AccessManager). */
    roleId: bigint("role_id", { mode: "bigint" }).notNull(),
    /** Lowercased 0x… */
    account: text("account").notNull(),
    /** Execution delay set on the role for this account, in seconds. */
    executionDelay: integer("execution_delay").notNull().default(0),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull(),
    grantedBlock: bigint("granted_block", { mode: "bigint" }).notNull(),
    grantedTxHash: text("granted_tx_hash").notNull(),
    grantedBy: text("granted_by").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.accessManagerId, t.roleId, t.account] }),
    index("ra_account_idx").on(t.account),
    index("ra_am_role_idx").on(t.accessManagerId, t.roleId),
  ],
);

// ─── Append-only event log (audit + reconciliation) ────────────
// Every relevant AM event lands here exactly once. The unique
// index on (am, tx, log_index) makes reindexing idempotent.

export const roleAssignmentEvents = pgTable(
  "role_assignment_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accessManagerId: uuid("access_manager_id")
      .notNull()
      .references(() => accessManagers.id, { onDelete: "cascade" }),
    roleId: bigint("role_id", { mode: "bigint" }).notNull(),
    account: text("account").notNull(),
    kind: text("kind", {
      enum: [
        "granted",
        "revoked",
        "role_admin_changed",
        "role_grant_delay_changed",
        "target_function_role_changed",
      ],
    }).notNull(),
    blockNumber: bigint("block_number", { mode: "bigint" }).notNull(),
    blockTimestamp: timestamp("block_timestamp", { withTimezone: true }).notNull(),
    txHash: text("tx_hash").notNull(),
    logIndex: integer("log_index").notNull(),
    /** Tx originator (best-effort attribution). */
    byAccount: text("by_account"),
    extra: jsonb("extra"),
  },
  (t) => [
    uniqueIndex("rae_idem_uq").on(t.accessManagerId, t.txHash, t.logIndex),
    index("rae_account_block_idx").on(t.account, t.blockNumber),
    index("rae_am_block_idx").on(t.accessManagerId, t.blockNumber),
  ],
);

// ─── Indexer cursor (per chain) ────────────────────────────────
// One row per chain we index. The indexer scans up to this block
// (inclusive) and stores the highest fully-processed block here.

export const indexerCursors = pgTable("indexer_cursors", {
  chainId: integer("chain_id").primaryKey(),
  lastIndexedBlock: bigint("last_indexed_block", { mode: "bigint" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Inferred row types (use in app/indexer code) ──────────────
export type AccessManagerRow = typeof accessManagers.$inferSelect;
export type NewAccessManager = typeof accessManagers.$inferInsert;
export type RoleAssignmentRow = typeof roleAssignments.$inferSelect;
export type NewRoleAssignment = typeof roleAssignments.$inferInsert;
export type RoleAssignmentEventRow = typeof roleAssignmentEvents.$inferSelect;
export type NewRoleAssignmentEvent = typeof roleAssignmentEvents.$inferInsert;
