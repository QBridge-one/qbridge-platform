// ============================================================
// app/sign-up/[[...sign-up]]/page.tsx — Clerk-hosted sign-up UI
// ============================================================

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <SignUp
        appearance={{ elements: { rootBox: "shadow-none", card: "shadow-md" } }}
        signInUrl="/sign-in"
        forceRedirectUrl="/select-workspace"
      />
    </main>
  );
}
