# Platform contracts — architecture & integration map

The on-chain contract topology for QBridge, how the pieces relate, and **how each
class of contract is integrated into the app**. Read this before wiring a new
contract (factory, tokenRegistry, the per-deal token cluster, …).

Related: [`issuer-registry-integration.md`](./issuer-registry-integration.md) ·
[`issuer-registry-lifecycle.md`](./issuer-registry-lifecycle.md) ·
[`database-and-chain-roles.md`](./database-and-chain-roles.md) ·
`src/contracts/README.md` (codegen).

---

## Security-token model

The deal token is a **custom ERC-20**, **not** an ERC-3643 implementation — it does
**not** inherit the ERC-3643 interfaces. It is **ERC-3643-compatible**: an identity
registry + compliance checker gate transfers, so it interoperates with DeFi /
venues that expect ERC-3643-style permissioned tokens. Conceptually very similar
to T-REX (whitelisted holders, on-transfer compliance), just a leaner custom base.
A future **stablecoin** vertical will be a separate factory + ecosystem.

---

## Two layers

### 1. Platform layer — singletons (deployed once)

Governed by `platformAccessManager` + `platformTimelock`.

| Contract | Role | App status |
|----------|------|-----------|
| `platformAccessManager` | platform-wide roles/authority | in `registry.ts` |
| `platformTimelock` | platform governance delay | — |
| `issuerRegistry` | verified issuers (KYB → on-chain) | ✅ integrated |
| `tokenRegistry` | catalog of deployed deals/tokens | ⛔ next |
| `factory` | **deploys a full per-deal cluster in one tx** | ⛔ next |
| `implementations.*` | logic/templates the factory clones per deal | n/a (referenced by factory) |

### 2. Per-deal layer — clusters (one set per tokenized asset)

The `factory` creates a whole ecosystem per **deal** (e.g. a real-estate SPV).
`dealId = keccak256(dealName)` (sample: `keccak256("TRINNIUM-SA1-LLC")`).

| Contract | Role |
|----------|------|
| `token` | custom ERC-20 security token (share classes, e.g. A/AA/B × sub-tiers) |
| `identityRegistry` | per-deal investor whitelist |
| `complianceChecker` | per-deal transfer compliance |
| `navOracle` | NAV / pricing |
| `distributionSettlement` | distributions/payouts |
| `capitalCallManager` | capital calls |
| `tokenAccessManager` | per-deal roles/authority |
| `timelock` | per-deal governance delay |

Per-deal roles: `DEAL_ADMIN`, `PLATFORM_PROPOSER`, `ISSUER_EXECUTOR`, `TREASURY`, `CALCULATOR`.

---

## The integration distinction that matters

| Class | Examples | Address known at | How to wire |
|-------|----------|------------------|-------------|
| **Singleton** | `factory`, `tokenRegistry`, `issuerRegistry` | **build time** (1 address/chain) | `registry.ts` + `NEXT_PUBLIC_*` env; ABI → `yarn generate` → hooks use the registry address |
| **Per-deal** | `token`, `navOracle`, `capitalCallManager`, per-deal `tokenAccessManager`, … | **runtime** (1 set per deal) | same ABIs, but hooks take a **runtime `contractAddress`** arg; addresses are **discovered**, not hardcoded |

> `registry.ts` is only for singletons. It currently also lists `tokenAccessManager`
> as a singleton (`NEXT_PUBLIC_TOKEN_AM_*`) — that works for a single dev deal, but
> per-deal TAMs are really runtime-addressed and shouldn't be modeled as one global
> address at scale.

### Adding a singleton (factory / tokenRegistry)
1. `src/contracts/<key>/abi.json` → `yarn generate:manifest --only <key>` (review) → `yarn generate`.
2. Add the address key to `src/lib/contracts/registry.ts` (`ContractAddresses` + each chain map + a getter), reading `NEXT_PUBLIC_<KEY>_<NETWORK>`.
3. Add env vars (e.g. `NEXT_PUBLIC_FACTORY_SEPOLIA`, `NEXT_PUBLIC_TOKEN_REGISTRY_SEPOLIA`) to `.env` and `.env.example`.
4. Wire UI on the generated hooks (issuer-registry is the template).

### Per-deal addressing (the token cluster)
The generated read/write hooks already accept a `contractAddress` (e.g.
`useGetStatus(contractAddress, …)`), so the same ABI serves every deal. The work is
**discovering + persisting** each deal's addresses:
- Source of truth options: the **factory creation event** (emits the cluster
  addresses on `createDeal`), and/or **`tokenRegistry`** lookups by `dealId`.
- Cache the cluster (Postgres, keyed by `dealId`/issuer) so the app doesn't re-scan
  chain on every load — same "materialize chain state off-chain" pattern as the
  chain-role indexer (`docs/database-and-chain-roles.md`).
- Render per-deal UI against the resolved addresses.

`factory.createDeal(...)` is the heaviest write (deploys the whole cluster); treat
it like the other on-chain writes (`transactionService` + simulate + receipt
check) but expect a long-running tx and parse the emitted addresses from the
receipt.

---

## Deployed addresses — Sepolia (chainId 11155111)

Deployed `2026-05-31` · deployer `0xC3D4533949D52ee67447c87F40c8b98092FD1dF1`
(holds `ADMIN_ROLE` on `platformAccessManager`; `0x222AeFAA863C9F4281F1962Db17E6AB8f86cc5C9`
also granted `ADMIN_ROLE`). Platform timelock min delay = 0.

**Platform singletons**
| Contract | Address |
|----------|---------|
| platformAccessManager | `0x971A24B585f1bc13ACc4ae605cD41e94A7b3E1C0` |
| platformTimelock | `0x85554e96848801072FD22cf5d9D009d075184a29` |
| issuerRegistry | `0x87f248e0FF4d98C596F7c0eCc6b9720B680Ee115` |
| tokenRegistry | `0x1a9e060CA7F1f57143EAF3841ACCaDF59dd0A755` |
| factory | `0xD4397423e9F3E1d8809819FddE38533E8D12f59E` |

**Implementation templates** (cloned per deal): identityRegistry
`0xcC28d170b43ee473cc59f76E2Ed7c18aa2302f23`, oracle
`0x2C05b3d0Eb1d03b25261109029777b4ae51eE36f`, compliance
`0x9b5Fe5cc9AA09C431DE05E55a422CF9318701Fb5`, token
`0x7BC17e460d7d3ac3b86567B8Ee2127Eddb77556f`, distributionSettlement
`0x06b5944A4bb17592AF0915a7422F08AD7e45885E`, capitalCallManager
`0x455718a72A2DF1D40Db2D8f68E86d14Cc9EBb4e5`.
Proxy impls: issuerRegistry `0x9c31b352db9ae9aC1ae94Ae3254F0bA09B33958c`,
tokenRegistry `0xdc7333972F857E79e022Ecf27Bf3B3c56984ad95`,
factory `0x118175A0555DD49606EcE6776812C9025aD17e18`.

**Sample deal cluster** — "TRINNIUM SA1 LLC" (real estate),
`dealId = keccak256("TRINNIUM-SA1-LLC")` =
`0x8dcf96f98f32eba637abe618fc01d3a2bc2dd50b69b8747565b15968dd733f6f`,
issuer `0xC3D4533949D52ee67447c87F40c8b98092FD1dF1`. Class A/AA/B × 3 sub-tiers;
all operational roles set to the deployer (testnet).

| Contract | Address |
|----------|---------|
| token | `0x364D516EDD493d798bbf20e63d0711F321a5B30b` |
| complianceChecker | `0x182392fC1B29510bbb546429aa11CAd34906DA98` |
| identityRegistry | `0x50d597cADE717d4082f2404066992263f7B550c1` |
| navOracle | `0x01C7D1CAdE9837A1164eeF3553995A7959F3e1ab` |
| distributionSettlement | `0xFdE6b1da325Ae97d039DfF20b929cff373fCF6AF` |
| capitalCallManager | `0xCD56d1Cb377343D4843b41ca63e5c2B65ec36Ac5` |
| tokenAccessManager | `0x7C8d2aF15F8B67701Ce5c91734DAa0D079AcB676` |
| timelock | `0xe6631e740D350cE38Cdb1458CeDb0EBac4A5d1Fc` |

> Authoritative addresses live in the deploy artifacts / `.env`. This table is a
> human reference and may lag a redeploy — verify against env before trusting.

---

## Roadmap

1. **`tokenRegistry`** (singleton) — read the catalog of deals; the lookup layer
   for per-deal addresses.
2. **`factory`** (singleton) — `createDeal` flow (the heavy write; first real
   typed-input flow → build the shared `AddressField`/input primitives here).
3. **Per-deal token UI** — discover a deal's cluster (factory event / tokenRegistry),
   persist it, render holders/compliance/NAV/distributions/capital-calls against
   runtime addresses.
4. **Stablecoin vertical** (future) — separate factory + ecosystem; reuse the
   singleton-vs-per-deal patterns above.

Parked: `revokeIssuer` off-chain side (see `issuer-registry-lifecycle.md`).
