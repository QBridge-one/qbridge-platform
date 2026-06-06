// ============================================================
// lib/team/chain-roles.ts — server-side hydration of TeamMember.chainRoles
// from the indexer-backed Postgres `role_assignments` table.
//
// Scope semantics (matches the UX agreed in PR 3a):
//   - Ops plane (`accessManager: "platform"`) → exactly one platform AM
//     per chain. Returns roles ON THAT AM.
//   - Issuer workspace (`accessManager: "token"`) → every token AM owned
//     by `orgId`. Returns the AGGREGATE (true if the wallet holds the
//     role on at least one of the workspace's tokens). Per-token drill-
//     down lives in /tokens/[symbol]/team (PR 3b).
//
// Lookup is forgiving: unknown role IDs (e.g. SUPER_ADMIN, or a role
// from a future version of the AM) are silently dropped so a redeploy
// can't crash the team page.
// ============================================================

import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { accessManagers, roleAssignments } from "@/lib/db/schema";
import { PLATFORM_ROLES, TOKEN_ROLES } from "@/lib/contracts/roles";
import type { ChainRoleKey } from "@/types/team";

// ─── Role ID → ChainRoleKey lookup ──────────────────────────
// Invert the constant maps once at module load. Keys hidden from the
// team UI (PUBLIC, and SUPER_ADMIN if you want it suppressed at this
// layer) can be omitted here — see the comment below.

function invert<T extends Record<string, bigint>>(
  m: T,
): Map<bigint, keyof T & string> {
  const out = new Map<bigint, keyof T & string>();
  for (const [k, id] of Object.entries(m)) {
    if (k === "PUBLIC") continue; // never surfaced in team UI
    out.set(id, k as keyof T & string);
  }
  return out;
}

const PLATFORM_BY_ID = invert(PLATFORM_ROLES);
const TOKEN_BY_ID = invert(TOKEN_ROLES);

export type ChainRolesByWallet = Map<string, Partial<Record<ChainRoleKey, boolean>>>;

export interface GetChainRolesOpts {
  /** Chain we're reading on. Today: same chain the app's connected to. */
  chainId: number;
  /** Which AccessManager plane to read. */
  plane: "platform" | "token";
  /** Clerk org id (ops org for platform, issuer org for token). */
  orgId: string;
  /** Wallet addresses to hydrate (any case — normalized internally). */
  wallets: ReadonlyArray<string | null | undefined>;
}

/** Returns chainRoles keyed by lowercase wallet address. Wallets with
 *  no on-chain roles get an empty object so callers can spread safely. */
export async function getChainRolesForWallets(
  opts: GetChainRolesOpts,
): Promise<ChainRolesByWallet> {
  const out: ChainRolesByWallet = new Map();

  const normalizedWallets = opts.wallets
    .filter((w): w is string => !!w)
    .map((w) => w.toLowerCase());
  // Seed empty entries so callers always get a key per requested wallet.
  for (const w of normalizedWallets) out.set(w, {});
  if (normalizedWallets.length === 0) return out;

  // Find every AM in scope for this plane + org + chain.
  const ams = await db
    .select({ id: accessManagers.id })
    .from(accessManagers)
    .where(
      and(
        eq(accessManagers.chainId, opts.chainId),
        eq(accessManagers.kind, opts.plane),
        eq(accessManagers.orgId, opts.orgId),
      ),
    );

  if (ams.length === 0) return out;
  const amIds = ams.map((a) => a.id);
  const lookup = opts.plane === "platform" ? PLATFORM_BY_ID : TOKEN_BY_ID;

  // One query, aggregated client-side. The (account, am_role) indexes
  // make this fast even with thousands of assignments per org.
  const rows = await db
    .select({
      account: roleAssignments.account,
      roleId: roleAssignments.roleId,
    })
    .from(roleAssignments)
    .where(
      and(
        inArray(roleAssignments.accessManagerId, amIds),
        inArray(roleAssignments.account, normalizedWallets),
      ),
    );

  for (const r of rows) {
    const key = lookup.get(r.roleId) as ChainRoleKey | undefined;
    if (!key) continue;
    const bucket = out.get(r.account) ?? {};
    bucket[key] = true;
    out.set(r.account, bucket);
  }

  return out;
}

/** Convenience: pick the active chain id from env. Matches the rule
 *  in src/config/privy.ts (mainnet vs sepolia). When the app grows
 *  multi-chain this should accept a chain id explicitly. */
export function activeChainId(): number {
  return process.env.NEXT_PUBLIC_PRIVY_NETWORK === "mainnet" ? 1 : 11155111;
}
