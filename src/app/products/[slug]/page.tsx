import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/landing/marketing-shell";
import { ProductDetail } from "@/components/landing/product-detail";
import { MARKETING_PRODUCTS, getMarketingProduct } from "@/lib/marketing/products";

export function generateStaticParams() {
  return MARKETING_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getMarketingProduct(slug);
  if (!product) return { title: "Product — QBridge" };
  return {
    title: `${product.name} — QBridge`,
    description: product.summary,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getMarketingProduct(slug);
  if (!product) notFound();

  return (
    <MarketingShell>
      <ProductDetail product={product} />
    </MarketingShell>
  );
}
