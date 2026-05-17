// ============================================================
// types/roles.ts
// Thin facade over src/lib/contracts/roles.ts.
//
// Role IDs (bigint), human labels and descriptions all live with the
// UI catalogs (src/lib/mock/team.ts, src/lib/mock/platform-team.ts).
// This file only exposes the *role-name unions* used by RBAC code so
// downstream code doesn't have to reach into the contracts module.
// ============================================================

import { PLATFORM_ROLES, TOKEN_ROLES } from "@/lib/contracts/roles";

export { PLATFORM_ROLES, TOKEN_ROLES };

/** Platform AccessManager role keys (excludes OZ PUBLIC_ROLE). */
export type PlatformRole = Exclude<keyof typeof PLATFORM_ROLES, "PUBLIC">;

/** Token AccessManager role keys (excludes OZ PUBLIC_ROLE). */
export type TokenRole = Exclude<keyof typeof TOKEN_ROLES, "PUBLIC">;
