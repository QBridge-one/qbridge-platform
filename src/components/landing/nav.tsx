"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { T } from "./shared";
import { LandingNavCta } from "./landing-nav-cta";

const NAV_LINKS = ["Platform", "Compliance", "Use Cases", "About"];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const linkStyle = {
    color: T.muted,
    fontSize: 13,
    fontWeight: 500,
    textDecoration: "none" as const,
    letterSpacing: "0.04em",
    transition: "color 0.2s",
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .nav-desktop-links { display: flex; align-items: center; gap: 36px; }
        .nav-mobile-btn { display: none; }
        .nav-logo { width: 180px; height: auto; }
        .nav-inner { padding: 0 32px; }
        .nav-wallet-wrap { display: flex; flex-wrap: wrap; gap: 12px; }
        @media (max-width: 767px) {
          .nav-desktop-links { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
          .nav-logo { width: 140px !important; }
          .nav-inner { padding: 0 16px !important; }
          .nav-wallet-wrap { flex-direction: column; align-items: stretch; }
        .nav-wallet-wrap .nav-wallet-buttons { flex-direction: column; }
        }
      `}} />
      <nav style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        width: "100%",
        maxWidth: "100vw",
        zIndex: 100,
        background: scrolled ? "rgba(8,14,26,0.92)" : "rgba(8,14,26,0.6)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${T.border}`,
        transition: "background 0.4s ease",
      }}>
        <div className="nav-inner" style={{ maxWidth: 1160, width: "100%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68, minHeight: 68, overflow: "hidden" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0, textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/qbridge-logo.png"
              alt="QBridge logo"
              className="nav-logo"
              style={{ display: "block", mixBlendMode: "screen" }}
            />
          </Link>

          {/* Desktop: inline links - hidden on mobile via CSS */}
          <div className="nav-desktop-links">
            {NAV_LINKS.map(l => (
              <a key={l} href="#" style={linkStyle}
                onMouseEnter={e => (e.currentTarget.style.color = T.coldW)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>
                {l}
              </a>
            ))}
            <LandingNavCta />
          </div>

          {/* Mobile: hamburger - visible only on mobile via CSS */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="nav-mobile-btn"
            style={{
              flexDirection: "column",
              justifyContent: "center",
              gap: 5,
              width: 44,
              height: 44,
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: T.coldW,
            }}
          >
            <span style={{ display: "block", width: 22, height: 2, background: "currentColor", borderRadius: 1 }} />
            <span style={{ display: "block", width: 22, height: 2, background: "currentColor", borderRadius: 1 }} />
            <span style={{ display: "block", width: 22, height: 2, background: "currentColor", borderRadius: 1 }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay + drawer - always in DOM so it works as soon as hamburger is tapped */}
      <>
        <div
          role="button"
          tabIndex={0}
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          onKeyDown={e => e.key === "Escape" && setMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 101,
            background: "rgba(0,0,0,0.5)",
            opacity: menuOpen ? 1 : 0,
            visibility: menuOpen ? "visible" : "hidden",
            transition: "opacity 0.25s ease, visibility 0.25s ease",
            pointerEvents: menuOpen ? "auto" : "none",
          }}
        />
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(320px, 85vw)",
            zIndex: 102,
            background: T.navy,
            borderLeft: `1px solid ${T.border}`,
            padding: "80px 24px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            transform: menuOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.3s ease",
            boxShadow: menuOpen ? "-8px 0 24px rgba(0,0,0,0.3)" : "none",
          }}
        >
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 40,
              height: 40,
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: T.muted,
              fontSize: 24,
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            style={{ display: "block", flexShrink: 0, marginBottom: 8, textDecoration: "none" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/qbridge-logo.png"
              alt="QBridge logo"
              className="nav-logo"
              style={{ display: "block", mixBlendMode: "screen", width: 140, height: "auto" }}
            />
          </Link>
          {NAV_LINKS.map(l => (
            <a
              key={l}
              href="#"
              onClick={() => setMenuOpen(false)}
              style={{ ...linkStyle, fontSize: 16, padding: "12px 0", color: T.coldW }}
            >
              {l}
            </a>
          ))}
          <div className="nav-wallet-wrap" style={{ marginTop: 16 }}>
            <LandingNavCta />
          </div>
        </div>
      </>
    </>
  );
}
