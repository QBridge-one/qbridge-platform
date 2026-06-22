// ============================================================
// app/ops/admin/factory/page.tsx
// Deal factory status + pause/unpause controls. Ops-only; on-chain
// AccessManager enforces who may pause.
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { can } from "@/lib/auth/permissions";
import { FactoryStatusPanel } from "@/components/ops/FactoryStatusPanel";
import { StablecoinFactoryStatusPanel } from "@/components/ops/StablecoinFactoryStatusPanel";
import { getProduct } from "@/lib/products";

export default async function OpsFactoryPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!session.activeOrg || session.activeOrg.kind !== "ops") {
    redirect("/select-workspace");
  }
  if (!can(session.appRoles, "ops:contracts:deploy")) {
    redirect("/ops");
  }

  const stablecoinEnabled = getProduct("stablecoin").enabled;

  return (
    <div className="space-y-8 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Factories</h1>
        <p className="text-sm text-muted-foreground">
          Live status and emergency pause/unpause for each product&apos;s deployment factory.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Real Estate
        </h2>
        <div className="max-w-2xl">
          <FactoryStatusPanel />
        </div>
      </section>

      {stablecoinEnabled && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Stablecoin
          </h2>
          <div className="max-w-2xl">
            <StablecoinFactoryStatusPanel />
          </div>
        </section>
      )}
    </div>
  );
}
