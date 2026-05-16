// ============================================================
// lib/indexer/abi.ts
// Minimal viem-typed AccessManager event ABI for the indexer.
// Stays scoped to events we actually persist so the worker stays
// fast and easy to reason about. Add new events here AND extend
// process-event.ts together — never one without the other.
// ============================================================

import { parseAbi } from "viem";

export const ACCESS_MANAGER_EVENTS = parseAbi([
  "event RoleGranted(uint64 indexed roleId, address indexed account, uint32 delay, uint48 since, bool newMember)",
  "event RoleRevoked(uint64 indexed roleId, address indexed account)",
  "event RoleAdminChanged(uint64 indexed roleId, uint64 indexed admin)",
  "event RoleGrantDelayChanged(uint64 indexed roleId, uint32 delay, uint48 since)",
]);

/** Names we care about — keeps watch/backfill filters in one place. */
export const WATCHED_EVENT_NAMES = [
  "RoleGranted",
  "RoleRevoked",
  "RoleAdminChanged",
  "RoleGrantDelayChanged",
] as const;
export type WatchedEventName = (typeof WATCHED_EVENT_NAMES)[number];
