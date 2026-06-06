// ============================================================
// POST /api/wallet/bind  → bind the caller's Privy embedded wallet
//
// Privy replacement for the SIWE /api/wallet/link flow. The client
// sends its Privy identity token; the server verifies it (Privy-signed,
// self-contained) and extracts the embedded wallet address — no
// user-signed message, no popup. The binding is written to the
// canonical Postgres store (wallet_bindings), which the IdentityPort /
// OrganizationPort read primaryWallet from.
//
// Trust chain: caller is authenticated as a Clerk user (requireSession);
// the wallet address comes from a Privy-signed token, not a client claim.
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { auditLogAdapter, walletBindingAdapter } from "@/lib/container.server";
import { requireSession } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";
import { resolveEmbeddedWalletFromIdToken } from "@/lib/adapters/wallet-binding/privy-identity";

const BindSchema = z.object({
  idToken: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    // Authentication is the only gate: recording a user's own wallet is
    // identity plumbing, available to everyone (ops + issuers, pre/post-KYB).
    // KYB gates on-chain registration, not the wallet binding.
    const session = await requireSession();

    const parsed = BindSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Missing Privy identity token" },
        { status: 400 },
      );
    }

    const address = await resolveEmbeddedWalletFromIdToken(parsed.data.idToken);
    if (!address) {
      return NextResponse.json(
        { ok: false, error: "No embedded wallet in identity token" },
        { status: 422 },
      );
    }

    await walletBindingAdapter.upsert(session.user.id, address, "privy");
    await auditLogAdapter.append({
      orgId: session.activeOrg?.id ?? null,
      actorUserId: session.user.id,
      action: "wallet.linked",
      target: address,
      payload: { provider: "privy", method: "privy-id-token" },
    });

    return NextResponse.json({ ok: true, address });
  } catch (err) {
    return errorResponse(err);
  }
}
