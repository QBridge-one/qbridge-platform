"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { T, sectionBase, containerStyle, h2Style, bodyStyle } from "@/components/landing/shared";
import { isWeb3AuthConfigured } from "@/config/web3auth";

export function DashboardContent() {
  const { address, isConnected } = useAccount();

  if (!isWeb3AuthConfigured) {
    return (
      <main style={{ ...sectionBase, paddingTop: 120 }}>
        <div style={containerStyle}>
          <h2 style={h2Style}>Dashboard</h2>
          <p style={bodyStyle}>
            Web3Auth is not configured. Add NEXT_PUBLIC_WEB3AUTH_CLIENT_ID to .env
          </p>
        </div>
      </main>
    );
  }

  if (!isConnected) {
    return (
      <main style={{ ...sectionBase, paddingTop: 120 }}>
        <div style={containerStyle}>
          <h2 style={h2Style}>Dashboard</h2>
          <p style={bodyStyle}>
            Please connect your wallet to access the dashboard.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              marginTop: 24,
              padding: "12px 24px",
              background: T.warm,
              color: T.navy,
              fontWeight: 700,
              textDecoration: "none",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ ...sectionBase, paddingTop: 120 }}>
      <div style={containerStyle}>
        <h2 style={h2Style}>Welcome to QBridge</h2>
        <p style={bodyStyle}>
          Your compliant digital asset infrastructure dashboard.
        </p>
        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: "rgba(78,161,246,0.06)",
            border: `1px solid ${T.border}`,
            borderRadius: 4,
          }}
        >
          <p style={{ ...bodyStyle, marginBottom: 8, fontSize: 11, color: T.gold }}>
            CONNECTED WALLET
          </p>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 14,
              color: T.coldW,
              wordBreak: "break-all",
            }}
          >
            {address}
          </p>
        </div>
        <p style={{ ...bodyStyle, marginTop: 32, fontSize: 14, color: T.muted }}>
          More dashboard features coming soon.
        </p>
      </div>
    </main>
  );
}
