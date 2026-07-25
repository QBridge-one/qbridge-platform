// ============================================================
// app/onboarding/asset-class/page.tsx — Issuer asset-class selection.
//
// The explicit first step of issuer onboarding: choose ONE asset class. Replaces
// the old silent real-estate default. Pre-selects the product the issuer arrived
// through (/sign-up?product=… → qb_product cookie) when present.
//
// Guard ladder mirrors the KYB page; additionally skips ahead to KYB once the
// org already has a product entitlement (so this step shows exactly once).
// ============================================================

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/server";
import { listEnabledProducts, parseProductKeys } from "@/lib/products";
import { AssetClassPicker } from "./asset-class-picker";

const PRODUCT_INTENT_COOKIE = "qb_product";

export default async function AssetClassPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!session.activeOrg) redirect("/select-workspace");
  if (session.activeOrg.kind !== "issuer") redirect("/select-workspace");

  // Already chose an asset class → move on to KYB (this step shows once).
  if (session.activeOrg.products.length > 0) redirect("/onboarding/kyb");

  const options = listEnabledProducts().map((p) => ({
    key: p.key,
    label: p.label,
    tagline: p.tagline,
  }));

  // Pre-select the marketing entry product, if it's a valid enabled one.
  const cookieStore = await cookies();
  const intent = parseProductKeys([cookieStore.get(PRODUCT_INTENT_COOKIE)?.value])[0];
  const preselected =
    intent && options.some((o) => o.key === intent) ? intent : options[0]?.key ?? "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Getting started
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Choose your asset class</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          What do you want to issue on QBridge? This scopes your workspace and its compliance path.
          You can add another asset class later from settings.
        </p>
      </header>

      <AssetClassPicker options={options} preselected={preselected} orgName={session.activeOrg.name} />
    </main>
  );
}
