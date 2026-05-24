import type { InsightPost } from "../types";
import { DEFAULT_AUTHOR } from "../authors";
import { Lede, P, H2, UL, LI, Strong, A, Callout } from "../_ui";

export const metadata: InsightPost["metadata"] = {
  slug: "welcome-to-qbridge-insights",
  title: "Welcome to QBridge Insights",
  description:
    "QBridge Insights is where we publish our reading of the regulations, market structure, and operational realities of bringing regulated assets on-chain.",
  publishedAt: "2026-05-23",
  category: "product",
  tags: ["announcement", "editorial"],
  author: DEFAULT_AUTHOR,
  readMinutes: 2,
};

export default function Body() {
  return (
    <>
      <Lede>
        Tokenization is moving from pilot to production. The institutions
        getting it right are the ones who treat compliance as protocol, not
        paperwork — and the rest of the market is about to learn that the hard
        way.
      </Lede>

      <P>
        QBridge Insights is where we publish our reading of the regulations,
        market structure, and operational realities of bringing regulated
        assets on-chain. We do this because the open questions in this
        industry are not technical anymore. The hard problems are{" "}
        <Strong>jurisdictional, governance, and lifecycle</Strong> problems —
        and they get solved in writing, not in whitepapers.
      </P>

      <H2>What we&apos;ll cover</H2>
      <UL>
        <LI>
          <Strong>Regulation</Strong> — MiCA implementation, SEC posture, MAS
          and DFSA pilots, and the bilateral frameworks moving fastest.
        </LI>
        <LI>
          <Strong>Market</Strong> — issuance volumes, capital flows, and
          adoption signals across tokenized funds, private credit, and
          real-world assets.
        </LI>
        <LI>
          <Strong>Tokenization</Strong> — issuance models, token standards,
          and lifecycle operations that survive contact with regulators.
        </LI>
        <LI>
          <Strong>Compliance</Strong> — identity, transfer controls, sanctions
          screening, and audit, told from the operator&apos;s seat.
        </LI>
        <LI>
          <Strong>Product</Strong> — what we&apos;re building at QBridge and
          why.
        </LI>
      </UL>

      <H2>How to read us</H2>
      <P>
        We publish roughly weekly, sometimes more when a regulation lands.
        Every post is signed, dated, and sourced — if we got something wrong,
        we want to be able to fix it in public.
      </P>

      <Callout label="Subscribe">
        Subscribe to the <A href="/insights/rss.xml">RSS feed</A> or follow
        QBridge on LinkedIn for new posts.
      </Callout>
    </>
  );
}
