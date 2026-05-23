"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { T } from "./shared";
import { LandingNavCta } from "./landing-nav-cta";
import { MARKETING_NAV } from "@/lib/marketing/routes";

export function Nav() {
  const pathname = usePathname();
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

  const linkStyle = (active: boolean) => ({
    color: active ? T.coldW : T.muted,
    fontSize: 13,
    fontWeight: 500,
    textDecoration: "none" as const,
    letterSpacing: "0.04em",
    transition: "color 0.2s",
  });

  const closeMenu = () => setMenuOpen(false);

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

          <div className="nav-desktop-links">
            {MARKETING_NAV.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  style={linkStyle(active)}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.coldW; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.muted; }}
                >
                  {label}
                </Link>
              );
            })}
            <LandingNavCta />
          </div>

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

      <>
        <div
          role="button"
          tabIndex={0}
          aria-label="Close menu"
          onClick={closeMenu}
          onKeyDown={e => e.key === "Escape" && closeMenu()}
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
            onClick={closeMenu}
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
            onClick={closeMenu}
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
          {MARKETING_NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={closeMenu}
              style={{ ...linkStyle(pathname === href), fontSize: 16, padding: "12px 0", color: pathname === href ? T.coldW : T.muted }}
            >
              {label}
            </Link>
          ))}
          <div className="nav-wallet-wrap" style={{ marginTop: 16 }}>
            <LandingNavCta />
          </div>
        </div>
      </>
    </>
  );
}
