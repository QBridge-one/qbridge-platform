"use client";

import { T } from "./shared";

const links = ["Privacy Policy", "Terms of Use", "Contact"];

export function Footer() {
  return (
    <footer style={{
      background: T.navy,
      borderTop: `1px solid ${T.border}`,
      padding: "48px 32px",
    }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/qbridge-logo.png"
            alt="QBridge logo"
            style={{ width: 148, height: "auto", mixBlendMode: "screen" }}
          />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.gold, fontFamily: "'DM Mono', monospace" }}>
            Institutional Infrastructure
          </span>
        </div>
        <div style={{ fontSize: 12, color: T.muted }}>
          © 2025 QBridge. All rights reserved. Not a retail investment product.
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {links.map(l => (
            <a key={l} href="#" style={{ fontSize: 12, color: T.muted, textDecoration: "none" }}>{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
