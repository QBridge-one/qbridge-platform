// ============================================================
// lib/adapters/wallet-binding/privy-identity.ts
//
// Server-side resolution of a user's Privy embedded wallet from a
// verified Privy identity token. The identity token is a Privy-signed
// JWT that carries the user's linked accounts; PrivyClient.getUser({
// idToken }) verifies the signature and parses it locally (no API
// call / rate limit). This is the authoritative, no-SIWE source of
// the wallet↔user binding for Privy.
// ============================================================

import "server-only";

import { PrivyClient } from "@privy-io/server-auth";
import type { Address } from "../../core/types";

let client: PrivyClient | null = null;

function getClient(): PrivyClient {
  if (client) return client;
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error(
      "Privy server client requires NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET",
    );
  }
  client = new PrivyClient(appId, appSecret);
  return client;
}

const EVM_ADDR = /^0x[a-fA-F0-9]{40}$/;

/**
 * Verify a Privy identity token and return the user's embedded EVM
 * wallet address (lowercased), or null if the token has no embedded
 * Ethereum wallet. Throws if the token is invalid/expired.
 */
export async function resolveEmbeddedWalletFromIdToken(
  idToken: string,
): Promise<Address | null> {
  const user = await getClient().getUser({ idToken });
  for (const account of user.linkedAccounts) {
    if (
      account.type === "wallet" &&
      account.chainType === "ethereum" &&
      account.walletClientType === "privy"
    ) {
      const addr = account.address.toLowerCase();
      return EVM_ADDR.test(addr) ? (addr as Address) : null;
    }
  }
  return null;
}
