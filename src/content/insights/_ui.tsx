import type { ReactNode } from "react";
import Link from "next/link";
import { T } from "@/components/landing/shared";

/**
 * Typography helpers for QBridge Insights post bodies.
 *
 * Posts import only these — never raw <h1>/<p>/etc. — so that the editorial
 * style stays consistent across the entire publication. If a post needs a
 * one-off element, add a reusable helper here rather than inlining markup.
 *
 * Responsive sizing is handled in two places:
 *   - font-size uses `clamp(min, fluid, max)` so it scales without media
 *     queries
 *   - block margins are kept modest so they read well at all widths
 *
 * Page-level responsive layout (padding, column width, header spacing) lives
 * in the scoped `.ip-*` CSS inside `app/insights/[slug]/page.tsx`.
 */

const proseColor = T.coldW;
/** Body text. Tuned for ≥10:1 contrast on T.navy (#080E1A). */
const proseMuted = "#D6E2F2";

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: "clamp(22px, 3.4vw, 30px)",
        fontWeight: 700,
        lineHeight: 1.25,
        color: proseColor,
        margin: "48px 0 14px",
        scrollMarginTop: 96,
        textAlign: "left",
      }}
    >
      {children}
    </h2>
  );
}

export function H3({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3
      id={id}
      style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: "clamp(18px, 2.4vw, 21px)",
        fontWeight: 700,
        lineHeight: 1.3,
        color: proseColor,
        margin: "32px 0 10px",
        scrollMarginTop: 96,
        textAlign: "left",
      }}
    >
      {children}
    </h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: "clamp(15px, 1.6vw, 17px)",
        lineHeight: 1.75,
        color: proseMuted,
        margin: "0 0 20px",
        textAlign: "left",
      }}
    >
      {children}
    </p>
  );
}

/** Visually-distinct lede paragraph used right after the title. */
export function Lede({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: "clamp(17px, 2vw, 20px)",
        lineHeight: 1.55,
        color: proseColor,
        margin: "0 0 32px",
        fontFamily: "'Playfair Display', Georgia, serif",
        fontStyle: "italic",
        textAlign: "left",
      }}
    >
      {children}
    </p>
  );
}

export function UL({ children }: { children: ReactNode }) {
  return (
    <ul
      style={{
        fontSize: "clamp(15px, 1.6vw, 17px)",
        lineHeight: 1.75,
        color: proseMuted,
        margin: "0 0 24px",
        paddingLeft: 22,
        textAlign: "left",
      }}
    >
      {children}
    </ul>
  );
}

export function OL({ children }: { children: ReactNode }) {
  return (
    <ol
      style={{
        fontSize: "clamp(15px, 1.6vw, 17px)",
        lineHeight: 1.75,
        color: proseMuted,
        margin: "0 0 24px",
        paddingLeft: 22,
        textAlign: "left",
      }}
    >
      {children}
    </ol>
  );
}

export function LI({ children }: { children: ReactNode }) {
  return <li style={{ marginBottom: 8 }}>{children}</li>;
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong style={{ color: proseColor, fontWeight: 600 }}>{children}</strong>;
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  const isExternal = /^https?:\/\//.test(href);
  const linkStyle: React.CSSProperties = {
    color: T.accent,
    textDecoration: "underline",
    textDecorationColor: "rgba(78,161,246,0.4)",
    textUnderlineOffset: 3,
    wordBreak: "break-word",
  };
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={linkStyle}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} style={linkStyle}>
      {children}
    </Link>
  );
}

export function Quote({
  children,
  cite,
}: {
  children: ReactNode;
  cite?: string;
}) {
  return (
    <blockquote
      style={{
        borderLeft: `3px solid ${T.gold}`,
        background: "rgba(26,111,196,0.06)",
        padding: "16px 20px",
        margin: "28px 0",
        fontSize: "clamp(16px, 1.8vw, 18px)",
        lineHeight: 1.6,
        color: proseColor,
        fontStyle: "italic",
        fontFamily: "'Playfair Display', Georgia, serif",
        textAlign: "left",
      }}
    >
      {children}
      {cite && (
        <footer
          style={{
            marginTop: 12,
            fontSize: 13,
            color: T.muted,
            fontStyle: "normal",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.04em",
          }}
        >
          — {cite}
        </footer>
      )}
    </blockquote>
  );
}

/** Editor's-note style callout for asides, disclaimers, or important framing. */
export function Callout({
  label = "Note",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <aside
      style={{
        border: `1px solid ${T.navyBdr}`,
        background: T.navyMid,
        borderLeft: `3px solid ${T.gold}`,
        padding: "18px 20px",
        margin: "28px 0",
        borderRadius: 4,
        textAlign: "left",
      }}
    >
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: T.gold,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "clamp(14px, 1.6vw, 16px)",
          lineHeight: 1.7,
          color: proseMuted,
        }}
      >
        {children}
      </div>
    </aside>
  );
}

/**
 * Source / citation block. Putting external citations at the bottom of every
 * post helps both Google E-E-A-T signals and AI search models, which weight
 * source-grounded content more heavily.
 */
export function Sources({
  items,
}: {
  items: Array<{ label: string; url: string }>;
}) {
  return (
    <section
      style={{
        marginTop: 56,
        paddingTop: 24,
        borderTop: `1px solid ${T.border}`,
        textAlign: "left",
      }}
    >
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: T.gold,
          marginBottom: 16,
        }}
      >
        Sources
      </div>
      <ol style={{ paddingLeft: 22, margin: 0 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: proseMuted,
              marginBottom: 8,
              wordBreak: "break-word",
            }}
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: T.accent, textDecoration: "underline" }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
