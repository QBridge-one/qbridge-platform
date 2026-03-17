"use client";

import { useState, useEffect, useRef } from "react";

export const T = {
  navy:    "#080E1A",
  navyMid: "#0B1730",
  navyBdr: "#17355F",
  slate:   "#14345A",
  gold:    "#1A6FC4",
  goldDim: "#135698",
  coldW:   "#F2F7FF",
  muted:   "#8FAACB",
  accent:  "#4EA1F6",
  border:  "rgba(78,161,246,0.12)",
};

export const sectionBase: React.CSSProperties = {
  padding: "120px 0",
  position: "relative",
};

export const containerStyle: React.CSSProperties = {
  maxWidth: 1160,
  margin: "0 auto",
  padding: "0 32px",
};

export const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: T.gold,
  fontFamily: "'DM Mono', 'Courier New', monospace",
};

export const h2Style: React.CSSProperties = {
  fontSize: "clamp(28px, 4vw, 46px)",
  fontWeight: 700,
  color: T.coldW,
  lineHeight: 1.15,
  fontFamily: "'Playfair Display', Georgia, serif",
  marginBottom: 16,
};

export const bodyStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.75,
  color: T.muted,
  maxWidth: 560,
};

export const dividerStyle: React.CSSProperties = {
  width: 48,
  height: 2,
  background: T.gold,
  margin: "16px 0 28px",
};

export function GridTexture() {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.035, pointerEvents: "none" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#4C82BA" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-block",
      border: `1px solid ${T.goldDim}`,
      color: T.gold,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      padding: "5px 14px",
      borderRadius: 2,
      fontFamily: "'DM Mono', monospace",
      marginBottom: 24,
    }}>
      {children}
    </span>
  );
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
