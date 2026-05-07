// ============================================================
// lib/auth/role-bridge.ts
//
// Static map: off-chain AppRole ──▶ suggested on-chain ChainRoleKey[].
//
// This is *data only* — no contract calls happen here. It's used by:
//   1. The team UI to suggest which on-chain roles an admin should
//      grant when adding a person with a given off-chain role.
//   2. (Future) An "auto-grant" service that, after an admin promotes
//      a member off-chain, schedules the matching on-chain grants
//      through the AccessManager (respecting grant delays).
//
// IMPORTANT:
//   - Off-chain RBAC NEVER grants on-chain authority. Chain authority
//     is enforced by AccessManager contracts. This table is a hint.
//   - On-chain roles still go through AccessManager.schedule() +
//     execute(), respecting grant delays for sensitive roles.
//   - Ops-plane mappings are intentionally left empty for now: the
//     PlatformAccessManager role catalog is a separate concern and
//     will be wired in a follow-up step.
// ============================================================

import type { AppRole } from "../core/identity.types";
import type { ChainRoleKey } from "@/types/team";

export const ROLE_BRIDGE: Record<AppRole, readonly ChainRoleKey[]> = {
  // ── Issuer plane → TokenAccessManager roles ──
  // Workspace admin gets the contract admin authority + pause power.
  // Granular role separation is preferred for day-to-day ops; admin
  // is intentionally broad and should be a small group.
  issuer_admin: ["ADMIN", "PAUSER"],
  // CCO drives compliance + freeze/unfreeze. ENFORCER is the role
  // that gates investor-level enforcement actions on the token.
  issuer_compliance: ["COMPLIANCE", "ENFORCER"],
  // DR onboards investors but never holds chain authority — investor
  // approval flows go through CCO. No on-chain role suggested.
  issuer_dealer: [],
  // Operations runs minting / lifecycle but NOT compliance.
  issuer_operations: ["MINTER"],
  // Property managers update off-chain asset state. No chain role.
  issuer_property_manager: [],
  // Auditor — read-only on-chain.
  issuer_auditor: ["AUDITOR"],
  // Baseline member — no chain role.
  issuer_member: [],

  // ── Ops plane → PlatformAccessManager roles ──
  // Stubbed; populate once the platform role catalog is finalized.
  ops_admin: [],
  ops_compliance: [],
  ops_onboarding: [],
  ops_support: [],
  ops_engineer: [],
  ops_member: [],
};

/** Suggested chain roles for a SET of off-chain roles (deduped). */
export function suggestedChainRoles(
  roles: readonly AppRole[],
): ChainRoleKey[] {
  const out = new Set<ChainRoleKey>();
  for (const r of roles) {
    for (const c of ROLE_BRIDGE[r] ?? []) out.add(c);
  }
  return [...out];
}
