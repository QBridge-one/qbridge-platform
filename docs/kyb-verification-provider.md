# KYB verification provider (Persona / Sumsub)

Step 2 of issuer onboarding — identity verification for the legal entity, beneficial owners, and sanctions screening. Handled by a third-party provider behind the `KybVerificationPort`.

**Both Persona and Sumsub are wired** behind the same port. The platform picks one per case via `selectKybProvider({ jurisdiction })`:

- **Global default**: `KYB_PROVIDER` (`persona` | `sumsub`, default `persona`)
- **Per-jurisdiction override**: `KYB_JURISDICTION_PROVIDERS` — keys are ISO 3166-1 alpha-2 codes (e.g. `ca:sumsub,us:persona`). The issuer's jurisdiction is normalized to an ISO code (the application form is now a country dropdown that stores codes directly; legacy free-text values like `Canada` or `USA` are normalized at lookup so both forms work). Use this to route Canadian KYB to Sumsub while everyone else stays on Persona.

The chosen provider is stored on `AppOrg.kybCase.provider`, so status updates from each provider's webhook route correctly. The client widget ([KybVerificationWidget.tsx](../src/components/workspace/KybVerificationWidget.tsx)) renders the matching UI — Persona's imperative modal or Sumsub's inline `SumsubWebSdk` component — based on the `provider` returned by the start endpoint.

---

## 1. How it works today (Persona)

```
Issuer (browser)                  QBridge (server)                   Persona
─────────────────                 ──────────────────                 ───────
Click "Start verification"
       │
       ▼
POST /api/onboarding/             ──► personaKybAdapter
  kyb-verification/start                 .createCase()
                                         POST withpersona.com
                                           /api/v1/inquiries
                                  ◄── { inquiryId, sessionToken }
       │
       ▼
Persona SDK opens modal
  (document upload, selfie,
   liveness check)
       │
       ▼
User completes ─────────────────────────────────────────────► Persona processes
                                                                    │
                                                                    ▼
                                  POST /api/webhooks/persona  ◄── webhook fires
                                    verifySignature()              (HMAC-SHA256)
                                    updateOrgMetadata(kybCase)
                                    dispatchNotification()
                                         │
                                         ▼
                                  Stepper step 2 updates
                                  Email to issuer admins
```

### Provider details

| Setting | Value |
|---|---|
| Provider | [Persona](https://withpersona.com) |
| Dashboard | https://app.withpersona.com |
| API base | `https://withpersona.com/api/v1` |
| API auth | `Authorization: Bearer <PERSONA_API_KEY>` |
| API version header | `Persona-Version: 2023-01-05` |
| Client SDK | `persona` npm package (v5.x) |
| Webhook signature | HMAC-SHA256 — `Persona-Signature: t=<ts>,v1=<hex>` |

### Env vars

| Var | Where | Source |
|---|---|---|
| `PERSONA_API_KEY` | `.env.local` + Vercel + Railway | Persona Dashboard → Settings → API keys |
| `PERSONA_TEMPLATE_ID` | `.env.local` + Vercel + Railway | Persona Dashboard → Templates → copy template id (`itmpl_…`) |
| `PERSONA_WEBHOOK_SECRET` | `.env.local` + Vercel + Railway | Persona Dashboard → Webhooks → create endpoint → copy secret |
| `PERSONA_ENVIRONMENT` | `.env.local` (optional) | `sandbox` for testing, `production` for live |

### Webhook setup in Persona Dashboard

1. Go to **Webhooks** → **Add webhook**
2. URL: `https://qbridge.one/api/webhooks/persona`
3. Subscribe to events:
   - `inquiry.completed`
   - `inquiry.approved`
   - `inquiry.declined`
   - `inquiry.failed`
   - `inquiry.expired`
4. Copy the **signing secret** → `PERSONA_WEBHOOK_SECRET`

### Local dev

Persona can't reach `localhost`. Two options:
- **ngrok**: `ngrok http 3000` → use the ngrok URL as webhook endpoint in Persona (create a separate dev webhook)
- **Skip webhooks**: start the inquiry, observe it in Persona Dashboard, then manually set `kybCase.status` in Clerk org metadata to simulate the webhook

---

## 2. How to switch to Sumsub (or another provider)

The `KybVerificationPort` is the interface that decouples the platform from any specific provider. Switching means writing a new adapter — nothing else changes.

### What stays the same

| Component | File | Changes needed |
|---|---|---|
| Domain types | `src/lib/core/kyb-verification.ts` | None — `KybCaseStatus`, `KybCase`, `KybVerificationEvent` are provider-agnostic |
| Port interface | `src/lib/ports/kyb-verification.port.ts` | None |
| Onboarding stepper (step 2) | `src/components/workspace/OnboardingHub.tsx` | None — reads `kybCase.status` |
| Notification fanout | `src/app/api/webhooks/persona/route.ts` (logic) | Moves to a new webhook route; fanout logic is identical |
| Start route | `src/app/api/onboarding/kyb-verification/start/route.ts` | Calls the port, not the adapter directly — works as-is |
| Audit trail | Already writes `kyb_verification.started` + webhook events | None |
| Container switch | `src/lib/container.server.ts` | One-line change |

### What you write for Sumsub

| Component | File to create | What it does |
|---|---|---|
| Adapter | `src/lib/adapters/kyb-verification/sumsub.adapter.ts` | Implements `KybVerificationPort` using Sumsub's API |
| Webhook route | `src/app/api/webhooks/sumsub/route.ts` | Verifies Sumsub's webhook signature, calls the same notification + metadata update logic |
| Client widget (optional) | Update `PersonaVerification.tsx` or create `SumsubVerification.tsx` | Sumsub has its own [Web SDK](https://docs.sumsub.com/docs/web-sdk) — same pattern as Persona's modal |

### Step-by-step to swap

1. **Install Sumsub SDK**: `yarn add @sumsub/websdk` (or `@sumsub/websdk-react`)
2. **Write the adapter** — implement `createCase`, `getCaseStatus`, `handleWebhook`:
   - `createCase` → `POST https://api.sumsub.com/resources/accessTokens` (creates an applicant + access token)
   - `getCaseStatus` → `GET https://api.sumsub.com/resources/applicants/{id}/status`
   - `handleWebhook` → verify Sumsub's `x-payload-digest` HMAC-SHA256 header
3. **Create the webhook route** at `/api/webhooks/sumsub` — same structure as the Persona one (verify sig → parse event → update kybCase → notify)
4. **Swap in container**:
   ```ts
   // container.server.ts
   import { sumsubKybAdapter } from "./adapters/kyb-verification/sumsub.adapter";
   export const kybVerificationAdapter = sumsubKybAdapter;
   ```
   Or env-driven:
   ```ts
   const KYB_PROVIDER = process.env.KYB_PROVIDER ?? "persona";
   export const kybVerificationAdapter =
     KYB_PROVIDER === "sumsub" ? sumsubKybAdapter : personaKybAdapter;
   ```
5. **Update the client widget** — either swap `PersonaVerification.tsx` to use Sumsub's SDK, or create a `SumsubVerification.tsx` and toggle in `OnboardingHub.tsx` based on a `NEXT_PUBLIC_KYB_PROVIDER` env var.
6. **Set Sumsub env vars**: `SUMSUB_API_KEY`, `SUMSUB_SECRET_KEY`, `SUMSUB_WEBHOOK_SECRET`, `SUMSUB_LEVEL_NAME`
7. **Test**: same flow — issuer clicks Start → Sumsub modal → completes → webhook → stepper updates

### Sumsub API reference (when you need it)

| Concept | Sumsub term | Persona equivalent |
|---|---|---|
| Verification session | Applicant | Inquiry |
| Template | Level | Inquiry Template |
| Client SDK | `@sumsub/websdk` | `persona` |
| Server auth | HMAC-SHA256 signed requests | Bearer token |
| Webhook auth | `x-payload-digest` HMAC | `Persona-Signature` HMAC |
| Dashboard | https://cockpit.sumsub.com | https://app.withpersona.com |

---

## 3. Where the code lives

| Concern | File |
|---|---|
| Domain types | `src/lib/core/kyb-verification.ts` |
| Port | `src/lib/ports/kyb-verification.port.ts` |
| Persona adapter | `src/lib/adapters/kyb-verification/persona.adapter.ts` |
| Container wiring | `src/lib/container.server.ts` (exports `kybVerificationAdapter`) |
| Start route | `src/app/api/onboarding/kyb-verification/start/route.ts` |
| Persona webhook | `src/app/api/webhooks/persona/route.ts` |
| Client widget | `src/components/workspace/PersonaVerification.tsx` |
| Stepper (step 2 logic) | `src/components/workspace/OnboardingHub.tsx` → `kybVerificationStep()` |
| AppOrg.kybCase field | `src/lib/core/identity.types.ts` |
| Metadata parser | `src/lib/core/kyb-verification.ts` → `kybCaseFromMetadata()` |
| Clerk adapter (stores kybCase) | `src/lib/adapters/organization/clerk.adapter.ts` → `updateOrgMetadata()` |

---

## 4. Status mapping

All providers map to the same `KybCaseStatus` enum — the platform never sees provider-specific strings outside the adapter.

| KybCaseStatus | Meaning | Persona status | Sumsub status (expected) |
|---|---|---|---|
| `created` | Case exists, user hasn't started | `created` | `init` |
| `pending` | User started, provider is processing | `pending`, `processing` | `pending` |
| `needs_review` | Automated checks done, human review needed | `needs_review` | `queued`, `onHold` |
| `approved` | Verified | `approved` | `completed` (green) |
| `declined` | Rejected by provider | `declined` | `completed` (red) |
| `expired` | Session expired before completion | `expired` | — |
| `failed` | Provider-side error | `failed`, `errored` | — |

---

## 5. Open questions / TODO

### Beneficial-owner / shareholder KYC inside a KYB flow

During Sumsub sandbox testing, the KYB (company) level surfaced **beneficial owners / shareholders as separate individuals** that appear under "Individuals" in the Sumsub dashboard and may each need their own KYC. In the test these had to be added/reviewed **manually through the dashboard**.

**TODO — figure out the real-world flow:**
- How are UBOs/shareholders collected in production? Options:
  1. Sumsub's company level auto-prompts the applicant to add beneficial owners during the embedded flow (each gets a sub-inquiry), OR
  2. They're added server-side via the API when we create the company applicant (`companyInfo.beneficiaries`), OR
  3. They're pulled from a corporate registry by Sumsub and only flagged for manual review on mismatch.
- Decide whether QBridge collects UBO data in step 1 (application form) and passes it to Sumsub, or lets Sumsub's flow gather it.
- Confirm whether each UBO's individual KYC blocks the overall KYB `approved` status, or whether they're tracked separately.
- Same question for Persona's business inquiry template (associated individuals).
- Once understood, the `companyInfo`/beneficiary payload in `sumsub.adapter.ts` → `createCase()` may need to send UBO data, and the webhook handler may need to reflect UBO-level status in the case.

**Why it matters:** if UBO KYC is manual today, that's a scaling bottleneck and a compliance gap. Needs a defined, mostly-automated path before onboarding real issuers with multiple shareholders.
