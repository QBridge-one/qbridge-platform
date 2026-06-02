// ============================================================
// /api/ops/settings/kyb-tier
//
// Ops-toggleable runtime override for the active Sumsub KYB tier.
// When set, takes precedence over SUMSUB_KYB_LEVEL_TIER env.
//
// GET  → { tier: "basic" | "full" | null, source: "db" | "env" | "default" }
// POST → set { tier: "basic" | "full" }
//
// GET is gated by ops:flags:edit so only ops who can flip the flag
// can see what it's currently set to. (Lower-privileged ops members
// see the active tier via the regular KYB flow.)
// ============================================================

import { NextResponse } from "next/server";
import {
  auditLogAdapter,
  platformSettingsAdapter,
} from "@/lib/container.server";
import { errorResponse } from "@/lib/auth/api";
import { requirePermission } from "@/lib/auth/server";
import { PLATFORM_SETTING_VALIDATORS } from "@/lib/core/platform-settings";

type Tier = "basic" | "full";

function envDefaultTier(): Tier {
  const raw = process.env.SUMSUB_KYB_LEVEL_TIER?.trim().toLowerCase();
  return raw === "basic" ? "basic" : "full";
}

export async function GET() {
  try {
    await requirePermission("ops:flags:edit");
    const db = await platformSettingsAdapter.get("kyb.tier");
    if (db) {
      return NextResponse.json({ tier: db, source: "db" });
    }
    return NextResponse.json({ tier: envDefaultTier(), source: "env" });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("ops:flags:edit");
    const body = (await req.json().catch(() => ({}))) as { tier?: unknown };
    const validated = PLATFORM_SETTING_VALIDATORS["kyb.tier"](body.tier);
    if (!validated) {
      return NextResponse.json(
        { error: "tier must be 'basic' or 'full'" },
        { status: 400 },
      );
    }
    await platformSettingsAdapter.set("kyb.tier", validated, session.user.id);
    await auditLogAdapter.append({
      orgId: null,
      actorUserId: session.user.id,
      action: "ops.action",
      target: "kyb.tier",
      payload: { type: "platform_setting.set", key: "kyb.tier", value: validated },
    });
    return NextResponse.json({ ok: true, tier: validated });
  } catch (err) {
    return errorResponse(err);
  }
}
