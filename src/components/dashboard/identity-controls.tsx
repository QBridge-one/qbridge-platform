"use client";

// ============================================================
// components/dashboard/identity-controls.tsx
// Renders Clerk's <OrganizationSwitcher> + <UserButton> for the
// dashboard header. Falls back to nothing when Clerk isn't
// configured (memory mode), so the existing wallet button stays.
// ============================================================

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

const HAS_CLERK_KEY = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function IdentityControls() {
  if (!HAS_CLERK_KEY) return null;
  return (
    <div className="flex items-center gap-2">
      <OrganizationSwitcher
        hidePersonal
        afterSelectOrganizationUrl="/select-workspace"
        afterCreateOrganizationUrl="/select-workspace"
        appearance={{
          elements: {
            organizationSwitcherTrigger:
              "h-8 px-2 rounded-md border border-input bg-background text-xs",
          },
        }}
      />
      <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
    </div>
  );
}
