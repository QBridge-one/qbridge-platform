"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWeb3AuthConnect, useWeb3AuthDisconnect } from "@web3auth/modal/react";
import { useAccount } from "wagmi";
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
  const { connect, isConnected, loading } = useWeb3AuthConnect();
  const { disconnect } = useWeb3AuthDisconnect();
  const { address } = useAccount();

  const shortAddress =
    address && `${address.slice(0, 6)}...${address.slice(-4)}`;

  // Redirect to dashboard after successful connect (when on landing)
  useEffect(() => {
    if (isConnected && pathname === "/") {
      router.push("/dashboard");
    }
  }, [isConnected, pathname, router]);

  const handleConnect = () => connect();

  const handleLogout = () => disconnect({ cleanup: true });

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
          {shortAddress}
        </span>
        <Link
          href="/dashboard"
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
          Dashboard
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
