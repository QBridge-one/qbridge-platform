// ============================================================
// lib/core/chain-registration.ts
// On-chain IssuerRegistry registration snapshot.
//
// Separate from kybCase because it's a different system, different
// authority, different audit actor. kybCase tracks the off-chain
// identity verification (Sumsub/Persona). chainRegistration tracks
// whether QBridge ops has committed the issuer to the IssuerRegistry
// contract — the platform's final compliance gate before tokenizing.
// ============================================================

export type ChainRegistrationStatus = "registered" | "revoked";

export interface ChainRegistration {
  status: ChainRegistrationStatus;
  /** Tx hash of the verifyIssuer / registerIssuer call. */
  txHash: string;
  /** Chain id where the registration was committed. */
  chainId: number;
  /** ISO timestamp of when the tx confirmed (server-recorded). */
  registeredAt: string;
  /** Clerk user id of the ops admin who triggered the tx. */
  registeredBy: string;
}

export function chainRegistrationFromMetadata(
  meta: unknown,
): ChainRegistration | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Record<string, unknown>;
  const r = m.chainRegistration;
  if (!r || typeof r !== "object") return null;
  const x = r as Record<string, unknown>;
  if (x.status !== "registered" && x.status !== "revoked") return null;
  if (typeof x.txHash !== "string") return null;
  if (typeof x.registeredAt !== "string") return null;
  if (typeof x.registeredBy !== "string") return null;
  return {
    status: x.status,
    txHash: x.txHash,
    chainId: typeof x.chainId === "number" ? x.chainId : 0,
    registeredAt: x.registeredAt,
    registeredBy: x.registeredBy,
  };
}
