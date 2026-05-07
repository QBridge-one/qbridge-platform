"use client";

// ============================================================
// components/landing/landing-nav-cta.tsx
//
// Landing-page nav call-to-action. Renders Clerk-driven sign-in /
// sign-up buttons when the user is signed out, and a "Workspace"
// link + sign-out control when they're signed in.
//
// IMPORTANT: This component intentionally does NOT touch the
// wallet adapter (Web3Auth / Alchemy / Turnkey). On the landing
// page, identity is the only concern. The wallet is an in-app
// concern, surfaced inside /workspace and /ops via WalletStatus.
//
// When Clerk isn't configured (memory-mode dev), we fall back to
// plain links pointing at /sign-in and /sign-up (which are the
// Clerk-hosted pages and will themselves render the placeholder).
// ============================================================

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { T } from "./shared";

const HAS_CLERK_KEY = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const btnBase = {
  padding: "8px 16px",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  fontFamily: "'DM Mono', monospace",
  transition: "all 0.2s",
  cursor: "pointer",
  textDecoration: "none" as const,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ghostStyle = {
  ...btnBase,
  background: "transparent",
  border: `1px solid ${T.border}`,
  color: T.muted,
};

const primaryStyle = {
  ...btnBase,
  background: T.warm,
  border: `1px solid ${T.warm}`,
  color: T.navy,
};

function GhostLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={ghostStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = T.warm;
        e.currentTarget.style.color = T.warm;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.color = T.muted;
      }}
    >
      {children}
    </Link>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={primaryStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = T.navy;
        e.currentTarget.style.color = T.warm;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = T.warm;
        e.currentTarget.style.color = T.navy;
      }}
    >
      {children}
    </Link>
  );
}

function SignedOutCta() {
  return (
    <div className="nav-wallet-buttons" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <GhostLink href="/sign-in">Sign in</GhostLink>
      <PrimaryLink href="/sign-up">Get Started</PrimaryLink>
    </div>
  );
}

function SignedInCta() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const initials =
    (user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0] ?? "Q").toUpperCase();

  return (
    <div className="nav-wallet-buttons" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        title={user?.primaryEmailAddress?.emailAddress ?? undefined}
        style={{
          ...btnBase,
          color: T.muted,
          background: "transparent",
          border: "none",
          cursor: "default",
        }}
      >
        {initials}
      </span>
      <PrimaryLink href="/select-workspace">Workspace</PrimaryLink>
      <button
        type="button"
        onClick={() => void signOut({ redirectUrl: "/" })}
        style={ghostStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = T.warm;
          e.currentTarget.style.color = T.warm;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = T.border;
          e.currentTarget.style.color = T.muted;
        }}
      >
        Sign out
      </button>
    </div>
  );
}

function ClerkAwareCta() {
  const { isLoaded, isSignedIn } = useUser();

  // While Clerk hydrates, render the signed-out variant. Avoids a
  // visible flicker between the two states more often than not, since
  // most landing-page visitors are signed-out anyway.
  if (!isLoaded || !isSignedIn) return <SignedOutCta />;
  return <SignedInCta />;
}

export function LandingNavCta() {
  // Memory-mode dev: Clerk isn't mounted, so the Clerk hooks would throw.
  // Render plain links — /sign-in will display Clerk's hosted UI when
  // they're added later, or the placeholder until then.
  if (!HAS_CLERK_KEY) return <SignedOutCta />;
  return <ClerkAwareCta />;
}
