// ============================================================
// POST /api/wallet/nonce  → issue a fresh nonce + message
// Body: {}                (uses session user)
// Returns: { nonce, message, expiresAt }
// ============================================================

import { NextResponse } from "next/server";
import { walletLinkAdapter } from "@/lib/container.server";
import { requireSession } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";

export async function POST() {
  try {
    const session = await requireSession();
    const challenge = await walletLinkAdapter.challenge(session.user.id);
    return NextResponse.json({ ok: true, ...challenge });
  } catch (err) {
    return errorResponse(err);
  }
}
