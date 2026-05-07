// ============================================================
// app/sign-in/[[...sign-in]]/page.tsx — Clerk-hosted sign-in UI
// ============================================================

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <SignIn
        appearance={{ elements: { rootBox: "shadow-none", card: "shadow-md" } }}
        signUpUrl="/sign-up"
        forceRedirectUrl="/select-workspace"
      />
    </main>
  );
}
