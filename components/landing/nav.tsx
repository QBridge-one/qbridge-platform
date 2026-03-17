"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { T } from "./shared";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 100,
      background: scrolled ? "rgba(8,14,26,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? `1px solid ${T.border}` : "1px solid transparent",
      transition: "all 0.4s ease",
      padding: "0 32px",
    }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Image
            src="/qbridge-logo.png"
            alt="QBridge logo"
            width={156}
            height={52}
            priority
            style={{ width: 156, height: "auto", mixBlendMode: "screen", filter: "drop-shadow(0 0 8px rgba(78,161,246,0.4))" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          {["Platform", "Compliance", "Use Cases", "About"].map(l => (
            <a key={l} href="#" style={{ color: T.muted, fontSize: 13, fontWeight: 500, textDecoration: "none", letterSpacing: "0.04em", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = T.coldW)}
              onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
              {l}
            </a>
          ))}
          <a href="#contact" style={{
            background: "transparent",
            border: `1px solid ${T.gold}`,
            color: T.gold,
            padding: "8px 20px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
            fontFamily: "'DM Mono', monospace",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = T.gold; e.currentTarget.style.color = T.navy; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.gold; }}>
            Request Access
          </a>
        </div>
      </div>
    </nav>
  );
}
