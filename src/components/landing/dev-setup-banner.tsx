// ============================================================
// components/landing/dev-setup-banner.tsx
// One-line banner shown on "/" only when IDENTITY_PROVIDER is unset
// AND we're running outside production. Helps a fresh clone see why
// the marketing page is showing instead of a workspace, and points
// to the .env knob that flips them between Clerk and the in-process
// dev fixture.
// ============================================================

import "server-only";
import { IDENTITY_PROVIDER_RESOLVED } from "@/lib/container.server";

export function DevSetupBanner() {
  if (process.env.NODE_ENV === "production") return null;
  if (IDENTITY_PROVIDER_RESOLVED !== "none") return null;

  return (
    <div className="w-full border-b border-amber-300/40 bg-amber-50/80 text-amber-900 text-xs px-4 py-2 text-center">
      <span className="font-medium">Dev:</span>{" "}
      no <code className="rounded bg-amber-100 px-1">IDENTITY_PROVIDER</code> set —{" "}
      copy <code className="rounded bg-amber-100 px-1">.env.example</code> to{" "}
      <code className="rounded bg-amber-100 px-1">.env</code> and choose{" "}
      <code className="rounded bg-amber-100 px-1">memory</code> (fixture) or{" "}
      <code className="rounded bg-amber-100 px-1">clerk</code> (real auth).
    </div>
  );
}
