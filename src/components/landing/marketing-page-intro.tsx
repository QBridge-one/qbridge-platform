"use client";

import { T, containerStyle, labelStyle, h2Style, bodyStyle, dividerStyle, FadeIn } from "./shared";

interface MarketingPageIntroProps {
  label: string;
  title: string;
  description: string;
}

export function MarketingPageIntro({ label, title, description }: MarketingPageIntroProps) {
  return (
    <section
      style={{
        padding: "80px 0 48px",
        position: "relative",
        background: `linear-gradient(to bottom, ${T.navyMid}, ${T.navy})`,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={containerStyle}>
        <FadeIn>
          <span style={labelStyle}>{label}</span>
          <h1 style={{ ...h2Style, marginTop: 12, fontSize: "clamp(28px, 5vw, 44px)" }}>{title}</h1>
          <div style={dividerStyle} />
          <p style={{ ...bodyStyle, maxWidth: 720 }}>{description}</p>
        </FadeIn>
      </div>
    </section>
  );
}
