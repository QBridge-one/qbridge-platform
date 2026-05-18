// ============================================================
// GET  /api/notifications        — list current user's notifications
// POST /api/notifications/read-all — mark every unread row read
//
// The bell dropdown polls GET; the "mark all" button posts to
// /api/notifications/read-all. Per-row mark-read lives at
// /api/notifications/[id]/route.ts.
//
// Auth: requireSession — every authenticated user has a feed of
// their own. Ops vs issuer plane doesn't gate access to the feed
// itself; recipient resolution at fanout time already enforces who
// sees what.
// ============================================================

import { NextResponse } from "next/server";
import { notificationAdapter } from "@/lib/container.server";
import { requireSession } from "@/lib/auth/server";
import { errorResponse } from "@/lib/auth/api";

const MAX_LIMIT = 100;

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get("unreadOnly") === "1";
    const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
      : 50;
    const beforeRaw = Number.parseInt(url.searchParams.get("before") ?? "", 10);
    const before = Number.isFinite(beforeRaw) ? beforeRaw : undefined;

    const [notifications, unread] = await Promise.all([
      notificationAdapter.listForUser(session.user.id, {
        unreadOnly,
        limit,
        before,
      }),
      notificationAdapter.unreadCount(session.user.id),
    ]);
    return NextResponse.json({ notifications, unread });
  } catch (err) {
    return errorResponse(err);
  }
}
