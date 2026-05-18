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

import { sql } from "drizzle-orm";
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

// ─── Audit entries (off-chain action log) ──────────────────────
// Promoted from the in-memory MemoryAuditLogAdapter. Captures every
// off-chain action (invites, role changes, KYB lifecycle, ops actions).
// On-chain events still live in role_assignment_events above; a
// reporting layer may stitch them by ts.
//
// Identifier columns (org_id, actor_user_id) are plain text — they
// reference Clerk ids, not local FKs, so there is no relational
// constraint here (matches the pattern in access_managers).

export const auditEntries = pgTable(
  "audit_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null for system-wide events (e.g. webhook ingest of an event
     *  not yet bound to a specific org). */
    orgId: text("org_id"),
    actorUserId: text("actor_user_id").notNull(),
    /** Action token from AuditAction in core/identity.types. */
    action: text("action").notNull(),
    /** Free-form target identifier (org slug, member user id, invite id, …). */
    target: text("target"),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_org_ts_idx").on(t.orgId, t.ts.desc()),
    index("audit_actor_ts_idx").on(t.actorUserId, t.ts.desc()),
    index("audit_action_ts_idx").on(t.action, t.ts.desc()),
  ],
);

// ─── In-app notifications (per-recipient fanout) ───────────────
// One row per recipient. The notification service resolves a
// RecipientRule (org + plane + roles) into N rows in a single
// transaction with the originating state change.
//
// Dedupe: when a caller provides `dedupe_key`, a partial-unique
// index prevents (kind, org_id, user_id, dedupe_key) duplicates —
// used to coalesce the UI-trigger + Clerk-webhook backup paths.

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** NotificationKind from core/notification.ts. */
    kind: text("kind").notNull(),
    /** Org this notification is ABOUT (issuer org for kyb.*). */
    orgId: text("org_id").notNull(),
    /** Recipient user id. */
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    actionUrl: text("action_url"),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    /** Caller-supplied collision key. NULL = no dedupe. */
    dedupeKey: text("dedupe_key"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Bell dropdown: unread first, then chronological.
    index("notif_user_read_created_idx").on(
      t.userId,
      t.readAt,
      t.createdAt.desc(),
    ),
    // Ops queue filters by org+kind.
    index("notif_org_kind_created_idx").on(t.orgId, t.kind, t.createdAt.desc()),
    // Partial unique for caller-driven dedupe.
    uniqueIndex("notif_dedupe_uq")
      .on(t.kind, t.orgId, t.userId, t.dedupeKey)
      .where(sql`dedupe_key IS NOT NULL`),
  ],
);

// ─── Email outbox (transactional dispatch queue) ───────────────
// Written in the same tx as the notification row. A dispatcher
// leases rows by setting `locked_until`, sends via EmailPort, then
// marks `sent_at`. Failures bump `attempts` + record `last_error`.
//
// `channel` is "email" today; the column is here so the table can
// generalize (slack, webhook, push) without a schema change.

export const notificationOutbox = pgTable(
  "notification_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    channel: text("channel").notNull().default("email"),
    /** Mirrors the notification kind so workers can filter/route. */
    kind: text("kind").notNull(),
    toAddress: text("to_address").notNull(),
    /** Recipient user id, when known. NULL for system-targeted sends. */
    toUserId: text("to_user_id"),
    orgId: text("org_id"),
    subject: text("subject").notNull(),
    html: text("html").notNull(),
    textBody: text("text_body"),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    dedupeKey: text("dedupe_key"),
    attempts: integer("attempts").notNull().default(0),
    /** When a dispatcher holds a lease; expires for retry. */
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Worker poll: unsent rows in arrival order.
    index("outbox_pending_idx")
      .on(t.lockedUntil, t.createdAt)
      .where(sql`sent_at IS NULL`),
    uniqueIndex("outbox_dedupe_uq")
      .on(t.channel, t.kind, t.toAddress, t.dedupeKey)
      .where(sql`dedupe_key IS NOT NULL`),
  ],
);

// ─── Inferred row types (use in app/indexer code) ──────────────
export type AccessManagerRow = typeof accessManagers.$inferSelect;
export type NewAccessManager = typeof accessManagers.$inferInsert;
export type RoleAssignmentRow = typeof roleAssignments.$inferSelect;
export type NewRoleAssignment = typeof roleAssignments.$inferInsert;
export type RoleAssignmentEventRow = typeof roleAssignmentEvents.$inferSelect;
export type NewRoleAssignmentEvent = typeof roleAssignmentEvents.$inferInsert;
export type AuditEntryRow = typeof auditEntries.$inferSelect;
export type NewAuditEntry = typeof auditEntries.$inferInsert;
export type NotificationRow = typeof notifications.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;
export type NotificationOutboxRow = typeof notificationOutbox.$inferSelect;
export type NewNotificationOutbox = typeof notificationOutbox.$inferInsert;
