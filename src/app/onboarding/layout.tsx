// ============================================================
// app/onboarding/layout.tsx — Thin shell for issuer onboarding (KYB).
// Auth is enforced via clerkMiddleware + per-page checks.
// ============================================================

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
