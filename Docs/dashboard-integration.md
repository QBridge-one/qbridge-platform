# Dashboard integration (from `AIcreated/`)

## Phase 1

| Source (concept) | Project path |
|------------------|--------------|
| `types/assets.ts` | `src/types/assets.ts` |
| `types/roles.ts` | `src/types/roles.ts` |
| `lib/validators/asset-wizard.ts` | `src/lib/validators/asset-wizard.ts` |
| `sidebar.tsx`, `stat-card.tsx` | `src/components/dashboard/` |
| Dashboard shell | `src/app/dashboard/layout.tsx` |
| Overview | `src/app/dashboard/page.tsx` |
| Asset wizard | `src/app/dashboard/assets/new/` + `_components/` |

## Phase 2 (from `AIcreated/phase2/`)

| Source | Project path |
|--------|--------------|
| `db.ts` | `src/types/db.ts` |
| `mock-data.ts` | `src/lib/mock-data.ts` |
| `asset-status-badge.tsx` | `src/components/dashboard/asset-status-badge.tsx` |
| `page.tsx` (assets list) | `src/app/dashboard/assets/page.tsx` |
| `assets/[id]/page.tsx` | `src/app/dashboard/assets/[id]/page.tsx` |
| `tokens/page.tsx` | `src/app/dashboard/tokens/page.tsx` |
| `cap-table/page.tsx` | `src/app/dashboard/cap-table/page.tsx` |
| `compliance/page.tsx` | `src/app/dashboard/compliance/page.tsx` |
| `settings/team/page.tsx` | `src/app/dashboard/settings/team/page.tsx` |

**Shadcn components added for Phase 2:** `dropdown-menu`, `tabs`, `alert-dialog`.

Original notes: `AIcreated/README.md`, Phase 2 reference copies under `AIcreated/phase2/`.

## Adjustments for this repo (build / tooling)

1. **`tsconfig.json`** — `AIcreated/` is excluded from TypeScript so duplicate sources don’t break the build.
2. **`src/lib/validators/asset-wizard.ts`** — Zod v4 uses `message` on `z.enum()` instead of `errorMap`. `allowedJurisdictions` / `blockedJurisdictions` use plain `z.array(z.string())` for `zodResolver` + RHF.
3. **`src/components/dashboard/stat-card.tsx`** — `"use client"` removed so the overview (Server Component) can pass Lucide icons without prerender serialization errors.
4. **`src/app/dashboard/page.tsx`** — Recent assets / alerts use mock IDs (`asset-1`, `asset-2`, …) so links match `src/lib/mock-data.ts`.

## Still not in repo (sidebar may 404)

- `/dashboard/analytics`
- `/dashboard/documents`
- `/dashboard/admin/issuers`, `/dashboard/admin/flags`
- `/dashboard/settings` (root; **team** exists at `/dashboard/settings/team`)
