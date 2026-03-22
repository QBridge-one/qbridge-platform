"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWallet } from "@/lib/hooks/useWallet";
import { T } from "@/components/landing/shared";
import { isWeb3AuthConfigured } from "@/config/web3auth";

const btnBase = {
  padding: "8px 16px",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  fontFamily: "'DM Mono', monospace",
  transition: "all 0.2s",
};

function WalletButtonInner() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    connect,
    disconnect,
    isConnected,
    isConnecting: loading,
    shortAddress,
  } = useWallet();

  // Redirect to issuer workspace after successful connect (when on landing)
  useEffect(() => {
    if (isConnected && pathname === "/") {
      router.push("/workspace");
    }
  }, [isConnected, pathname, router]);

  const handleConnect = () => connect();

  const handleLogout = () => disconnect();

  if (isConnected) {
    return (
      <div className="nav-wallet-buttons" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            ...btnBase,
            color: T.muted,
            background: "transparent",
            border: "none",
            cursor: "default",
          }}
        >
          {shortAddress ?? ""}
        </span>
        <Link
          href="/workspace"
          style={{
            ...btnBase,
            background: T.warm,
            border: `1px solid ${T.warm}`,
            color: T.navy,
            textDecoration: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.navy;
            e.currentTarget.style.color = T.warm;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = T.warm;
            e.currentTarget.style.color = T.navy;
          }}
        >
          Workspace
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            ...btnBase,
            background: "transparent",
            border: `1px solid ${T.border}`,
            color: T.muted,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = T.warm;
            e.currentTarget.style.color = T.warm;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.color = T.muted;
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="nav-wallet-buttons" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        type="button"
        onClick={handleConnect}
        disabled={loading}
        style={{
          ...btnBase,
          background: "transparent",
          border: `1px solid ${T.border}`,
          color: T.muted,
          cursor: loading ? "wait" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.borderColor = T.warm;
            e.currentTarget.style.color = T.warm;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = T.border;
          e.currentTarget.style.color = T.muted;
        }}
      >
        Login
      </button>
      <button
        type="button"
        onClick={handleConnect}
        disabled={loading}
        style={{
          ...btnBase,
          background: T.warm,
          border: `1px solid ${T.warm}`,
          color: T.navy,
          cursor: loading ? "wait" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.background = T.navy;
            e.currentTarget.style.color = T.warm;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = T.warm;
          e.currentTarget.style.color = T.navy;
        }}
      >
        {loading ? "Connecting..." : "Get Started"}
      </button>
    </div>
  );
}

function WalletButtonPlaceholder() {
  return (
    <div className="nav-wallet-buttons" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        type="button"
        disabled
        title="Add NEXT_PUBLIC_WEB3AUTH_CLIENT_ID to .env and restart dev server"
        style={{
          ...btnBase,
          background: "transparent",
          border: `1px solid ${T.border}`,
          color: T.muted,
          cursor: "not-allowed",
          opacity: 0.7,
        }}
      >
        Login
      </button>
      <button
        type="button"
        disabled
        style={{
          ...btnBase,
          background: "transparent",
          border: `1px solid ${T.border}`,
          color: T.muted,
          cursor: "not-allowed",
          opacity: 0.7,
        }}
      >
        Get Started
      </button>
    </div>
  );
}

export function WalletButton() {
  if (!isWeb3AuthConfigured) return <WalletButtonPlaceholder />;
  return <WalletButtonInner />;
}
