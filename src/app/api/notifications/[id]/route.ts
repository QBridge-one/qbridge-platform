// ============================================================
// POST /api/notifications/[id]/read — mark a single notification read
//
// Idempotent. Silently no-ops if the row doesn't belong to the
// current user or is already read (avoids leaking existence).
// ============================================================

import { NextResponse } from "next/server";
import { notificationAdapter } from "@/lib/container.server";
import { requireSession } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    await notificationAdapter.markRead(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
