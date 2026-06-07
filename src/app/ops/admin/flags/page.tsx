// ============================================================
// app/ops/admin/flags/page.tsx
// Platform feature flags & runtime settings — ops-only.
//
// Today: KYB tier toggle (Sumsub basic / full). Future toggles
// (default email provider override, audit retention, etc.) plug in
// here, each backed by the same platformSettingsAdapter + the
// typed PlatformSettingKey union.
// ============================================================

import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";
import { platformSettingsAdapter } from "@/lib/container.server";
import { KybTierToggle } from "@/components/ops/KybTierToggle";
import { DefaultExpirationSetting } from "@/components/ops/DefaultExpirationSetting";

type Tier = "basic" | "full";
type Source = "db" | "env" | "default";

function envDefaultTier(): Tier {
  const raw = process.env.SUMSUB_KYB_LEVEL_TIER?.trim().toLowerCase();
  return raw === "basic" ? "basic" : "full";
}

export default async function OpsFlagsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!session.activeOrg || session.activeOrg.kind !== "ops") {
    redirect("/select-workspace");
  }
  if (!can(session.appRoles, "ops:flags:edit")) {
    redirect("/ops");
  }

  const dbTier = await platformSettingsAdapter.get("kyb.tier");
  const tier: Tier = dbTier ?? envDefaultTier();
  const source: Source = dbTier ? "db" : "env";

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Platform settings</h1>
        <p className="text-sm text-muted-foreground">
          Runtime-toggleable platform configuration. Changes take effect immediately and
          override the corresponding environment variables.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Sumsub KYB tier</CardTitle>
          <CardDescription>
            Picks which Sumsub level new issuer verifications use. Useful for testing the
            difference between a lighter (basic) and deeper (full) KYB flow without
            redeploying.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KybTierToggle initialTier={tier} initialSource={source} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issuer registration expiry</CardTitle>
          <CardDescription>
            Default validity period applied to new on-chain issuer registrations and wallet
            migrations. Existing issuers are not affected. This is an on-chain setting on
            IssuerRegistry — it requires an ops wallet authorized on the contract.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DefaultExpirationSetting />
        </CardContent>
      </Card>
    </div>
  );
}
