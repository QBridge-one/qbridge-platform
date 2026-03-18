"use client";

import { T, sectionBase, containerStyle, h2Style, bodyStyle, GridTexture, FadeIn, Pill } from "./shared";

const badges = ["SOC 2 Ready", "Custom ERC-20 Infrastructure", "Multi-Jurisdiction", "Examination Ready"];

export function CTA() {
  return (
    <section id="contact" style={{ ...sectionBase, background: T.navyMid, textAlign: "center" }}>
      <GridTexture />
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={containerStyle}>
        <FadeIn>
          <Pill>For Regulated Institutions Only</Pill>
          <h2 style={{ ...h2Style, textAlign: "center", maxWidth: 640, margin: "12px auto 20px" }}>
            Ready to build compliant digital asset infrastructure?
          </h2>
          <p style={{ ...bodyStyle, textAlign: "center", margin: "0 auto 48px", maxWidth: 480 }}>
            QBridge works with financial institutions, asset managers, and capital market operators
            ready to launch regulated digital asset programs. Access is by application.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{
              background: T.warm,
              color: T.navy,
              padding: "16px 40px",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
            }}>
              Request a Demo
            </button>
            <button style={{
              background: "transparent",
              border: `1px solid ${T.navyBdr}`,
              color: T.muted,
              padding: "16px 40px",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}>
              Download Technical Brief
            </button>
          </div>

          <div style={{ marginTop: 80, paddingTop: 48, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
            {badges.map(badge => (
              <div key={badge} style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, border: `1px solid ${T.warm}`, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 12, height: 12, background: T.warm, opacity: 0.6 }} />
                </div>
                <div style={{ fontSize: 11, color: T.muted, letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>{badge}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
