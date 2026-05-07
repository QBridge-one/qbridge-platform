"use client";

// ============================================================
// components/providers/identity-provider.tsx
// Wraps the app with the active IdP's client provider.
//
// Clerk mode: <ClerkProvider> when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set.
// Memory mode: pass-through (no client identity).
// ============================================================

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

const HAS_CLERK_KEY = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function IdentityProvider({ children }: { children: ReactNode }) {
  if (HAS_CLERK_KEY) {
    return (
      <ClerkProvider afterSignOutUrl="/sign-in">{children}</ClerkProvider>
    );
  }
  return <>{children}</>;
}
