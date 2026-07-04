import type { Metadata } from "next";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { MarketingPageIntro } from "@/components/landing/marketing-page-intro";
import { ProductsGrid } from "@/components/landing/products-grid";

export const metadata: Metadata = {
  title: "Products — QBridge",
  description:
    "QBridge product lines for every asset class — real estate, stablecoins, private markets, credit, commodities, and more — on one shared tokenization platform.",
};

export default function ProductsPage() {
  return (
    <MarketingShell>
      <main>
        <MarketingPageIntro
          label="Products"
          title="A focused product for every asset class."
          description="QBridge is one tokenization platform delivered as distinct products per asset class — each with its own compliance model, lifecycle, and workspace, all on a shared identity, wallet, and registry layer."
        />
        <ProductsGrid />
      </main>
    </MarketingShell>
  );
}
