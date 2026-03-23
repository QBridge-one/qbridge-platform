# TODO: Separate issuer sign-in from QBridge platform admin

## Problem

- **Workspace (issuer)** and **Ops (platform)** dashboards today still blend identity: mock shells and flows assume a single connected wallet context.
- When the same address acts as both **platform admin** (PlatformAccessManager) and **issuer** (TokenAccessManager / issuer verification), issuer-only gates (“verified issuer”, token roles, etc.) are hard to exercise realistically.

## Goal

- Issuers **sign in separately** from QBridge internal operators (distinct auth session, and ideally distinct connected wallet or scoped credentials).
- Issuer dashboard should resolve **verified issuer** (registry, attestation, or backend) independently of ops/platform admin.

## Implementation notes (later)

- Wire `useWallet()` + route/layout context: `issuer` vs `ops` app shells with different expected roles.
- Replace hardcoded `walletAddress` props on `WorkspaceSidebar` / `OpsSidebar` with live wallet + server-verified issuer record.
- Align mock data so test issuers use addresses that hold **token** roles, not only platform roles, where appropriate.
