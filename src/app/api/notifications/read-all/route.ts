// ============================================================
// POST /api/notifications/read-all — mark every unread row read.
// ============================================================

import { NextResponse } from "next/server";
import { notificationAdapter } from "@/lib/container.server";
import { requireSession } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";

export async function POST() {
  try {
    const session = await requireSession();
    await notificationAdapter.markAllRead(session.user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
