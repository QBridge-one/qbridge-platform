"use client";

import { T, containerStyle, labelStyle, h2Style, bodyStyle, dividerStyle, FadeIn } from "./shared";

interface LegalPageContentProps {
  label: string;
  title: string;
  children: React.ReactNode;
}

export function LegalPageContent({ label, title, children }: LegalPageContentProps) {
  return (
    <section style={{ padding: "80px 0 120px", background: T.navy }}>
      <div style={containerStyle}>
        <FadeIn>
          <span style={labelStyle}>{label}</span>
          <h1 style={{ ...h2Style, marginTop: 12, fontSize: "clamp(28px, 5vw, 44px)" }}>{title}</h1>
          <div style={dividerStyle} />
          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
            {children}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return <p style={bodyStyle}>{children}</p>;
}

export function LegalHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ ...h2Style, fontSize: 22, marginTop: 16, marginBottom: 0 }}>
      {children}
    </h2>
  );
}
