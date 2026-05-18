// ============================================================
// GET /api/cron/drain-emails — drain the email outbox (one pass).
//
// Designed for Vercel cron, Railway cron, or any external scheduler
// hitting this route on a fixed interval (every 1–5 minutes works
// well at v1 volumes). Each call leases a small batch and returns
// when the batch is drained, so back-pressure is bounded.
//
// Authorization: header `Authorization: Bearer ${CRON_SECRET}`.
//   - When CRON_SECRET is unset, the route returns 503 — no quiet
//     "everyone can drain" footgun, no quiet "noop" either.
//   - Vercel cron sends its own `x-vercel-cron` header but we don't
//     trust just that; the bearer is mandatory.
// ============================================================

import { NextResponse } from "next/server";
import {
  emailAdapter,
  notificationAdapter,
} from "@/lib/container.server";
import { drainEmailOutbox } from "@/lib/services/notification.service";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  // Constant-time-ish compare (length-aware) — secrets are short so
  // the timing side-channel is negligible, but be tidy.
  if (auth.length !== expected.length || auth !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await drainEmailOutbox(
      { notification: notificationAdapter, email: emailAdapter },
      { batchSize: 25, leaseMs: 60_000 },
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/drain-emails] failed:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
