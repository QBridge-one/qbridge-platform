// ============================================================
// GET /api/session
// Returns the active session for the current user, or 401.
// Used by client components that need to render gated UI.
// ============================================================

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, session: s });
}
