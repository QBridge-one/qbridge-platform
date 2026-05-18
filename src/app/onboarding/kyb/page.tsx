// ============================================================
// app/onboarding/kyb/page.tsx — Issuer KYB capture + review states.
// ============================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { issuerWorkspaceKybBlocks } from "@/lib/core/issuer-kyb";
import { Button } from "@/components/ui/button";
import { KybForm } from "./kyb-form";

export default async function IssuerKybPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!session.activeOrg) redirect("/select-workspace");
  if (session.activeOrg.kind !== "issuer") redirect("/select-workspace");

  if (!issuerWorkspaceKybBlocks(session.activeOrg.kind, session.activeOrg.kybStatus)) {
    redirect("/workspace");
  }

  const { kybStatus, kybApplication, name: orgName } = session.activeOrg;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Issuer verification
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {kybStatus === "submitted"
            ? "Application under review"
            : "Tell us about your organization"}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {kybStatus === "submitted"
            ? "QBridge Compliance will review your KYB submission. You'll get workspace access once approved."
            : "We need a few details before you can use the issuer workspace. This usually takes one business day after submission."}
        </p>
      </header>

      {kybStatus === "submitted" && kybApplication ? (
        <section className="space-y-6 rounded-lg border bg-card p-6 text-sm shadow-sm">
          <dl className="space-y-3">
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Workspace</dt>
              <dd className="font-medium">{orgName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Legal entity</dt>
              <dd>{kybApplication.legalEntityName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Jurisdiction</dt>
              <dd>{kybApplication.jurisdiction}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Submitted</dt>
              <dd>{new Date(kybApplication.submittedAt).toLocaleString()}</dd>
            </div>
          </dl>
          <p className="text-muted-foreground text-xs">
            Need to fix something? Ask your QBridge onboarding contact to reopen the application or set
            status back to rejected in Clerk with a note — you can resubmit from this page after that.
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/select-workspace">Switch workspace</Link>
          </Button>
        </section>
      ) : (
        <KybForm orgName={orgName} initialStatus={kybStatus} />
      )}
    </main>
  );
}
