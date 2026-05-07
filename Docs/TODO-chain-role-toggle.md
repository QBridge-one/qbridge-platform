# TODO: Enable on-chain role toggle in team Permissions tab

## Problem

In `/workspace/settings/team` and `/ops/settings/team`, opening a member
and going to **Permissions → On-chain roles**, the toggles are disabled
even when the member's wallet is linked and the admin wallet is
connected.

## Root cause

The toggle's `disabled` predicate (in `src/components/team/TeamMemberSheet.tsx`):

```ts
const disabled =
  !wallet || !tokenAddress || loading || (isSelf && def.key === "ADMIN");
```

`tokenAddress` (and `platformAddress` for the ops plane) come from
`useTokenAMAddress()` / `usePlatformAMAddress()`, which read from the
contract registry, which reads from env vars. **Those env vars are not
set**, so the addresses resolve to `null` and the toggle stays disabled.

## Fix

Add the deployed addresses to `.env` (Sepolia shown):

```
NEXT_PUBLIC_PLATFORM_AM_SEPOLIA=0x...   # PlatformAccessManager
NEXT_PUBLIC_TOKEN_AM_SEPOLIA=0x...      # TokenAccessManager
```

Then restart `next dev`. Same pattern exists for mainnet
(`_MAINNET`) and polygon (`_POLYGON`) — see
`src/lib/contracts/registry.ts`.

## After that, also check

- The connected admin wallet must hold the contract's ADMIN role
  on-chain. Otherwise `grantRole` will revert.
- Members with no `walletAddress` (i.e. didn't complete the SIWE
  link flow) will still show "No wallet connected" — that's correct.
