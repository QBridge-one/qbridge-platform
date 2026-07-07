// ============================================================
// app/sign-up/[[...sign-up]]/page.tsx — Clerk-hosted sign-up UI
//
// Carries a marketing product intent (/sign-up?product=stablecoin) into a
// short-lived cookie so the new issuer's workspace is scoped to the product
// they arrived through (seeded at KYB submit).
// ============================================================

import { SignUp } from "@clerk/nextjs";
import { parseProductKeys } from "@/lib/products";
import { ProductIntentCookie } from "./product-intent-cookie";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;
  const intent = parseProductKeys([product])[0];

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      {intent && <ProductIntentCookie product={intent} />}
      <SignUp
        appearance={{ elements: { rootBox: "shadow-none", card: "shadow-md" } }}
        signInUrl="/sign-in"
        forceRedirectUrl="/select-workspace"
      />
    </main>
  );
}
