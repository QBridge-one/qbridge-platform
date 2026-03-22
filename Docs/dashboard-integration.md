# Dashboard integration (from `AIcreated/`)

## Product split (current)

| Area | Base path | Audience | Access manager |
|------|-----------|----------|----------------|
| **Workspace** | `/workspace` | Issuers | TokenAccessManager — `Team & access` |
| **Ops** | `/ops` | QBridge internal | PlatformAccessManager — `Team & access` |

Legacy URLs `/dashboard` and `/dashboard/*` redirect to `/workspace` and `/workspace/*`.

## Phase 1

| Source (concept) | Project path |
|------------------|--------------|
| `types/assets.ts` | `src/types/assets.ts` |
| `types/roles.ts` | `src/types/roles.ts` |
| `lib/validators/asset-wizard.ts` | `src/lib/validators/asset-wizard.ts` |
| `sidebar.tsx`, `stat-card.tsx` | `src/components/dashboard/` |
| Workspace shell | `src/app/workspace/layout.tsx` |
| Overview | `src/app/workspace/page.tsx` |
| Asset wizard | `src/app/workspace/assets/new/` + `_components/` |
| Ops shell | `src/app/ops/layout.tsx` |

## Phase 2 (from `AIcreated/phase2/`)

| Source | Project path |
|--------|--------------|
| `db.ts` | `src/types/db.ts` |
| `mock-data.ts` | `src/lib/mock-data.ts` |
| `asset-status-badge.tsx` | `src/components/dashboard/asset-status-badge.tsx` |
| `page.tsx` (assets list) | `src/app/workspace/assets/page.tsx` |
| `assets/[id]/page.tsx` | `src/app/workspace/assets/[id]/page.tsx` |
| `tokens/page.tsx` | `src/app/workspace/tokens/page.tsx` |
| `cap-table/page.tsx` | `src/app/workspace/cap-table/page.tsx` |
| `compliance/page.tsx` | `src/app/workspace/compliance/page.tsx` |
| Token team & access | `src/app/workspace/settings/team/page.tsx` |
| Platform team & access | `src/app/ops/settings/team/page.tsx` |

**Shadcn components added for Phase 2:** `dropdown-menu`, `tabs`, `alert-dialog`.

Original notes: `AIcreated/README.md`, Phase 2 reference copies under `AIcreated/phase2/`.

## Adjustments for this repo (build / tooling)

1. **`tsconfig.json`** — `AIcreated/` is excluded from TypeScript so duplicate sources don’t break the build.
2. **`src/lib/validators/asset-wizard.ts`** — Zod v4 uses `message` on `z.enum()` instead of `errorMap`. `allowedJurisdictions` / `blockedJurisdictions` use plain `z.array(z.string())` for `zodResolver` + RHF.
3. **`src/components/dashboard/stat-card.tsx`** — `"use client"` removed so the overview (Server Component) can pass Lucide icons without prerender serialization errors.
4. **`src/app/workspace/page.tsx`** — Recent assets / alerts use mock IDs (`asset-1`, `asset-2`, …) so links match `src/lib/mock-data.ts`.

## Placeholder routes

- **Workspace:** `/workspace/analytics`, `/workspace/documents`, `/workspace/settings`
- **Ops:** `/ops/analytics`, `/ops/admin/issuers`, `/ops/admin/flags`, `/ops/settings`
