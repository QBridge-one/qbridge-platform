# QBridge Insights — Authoring Guide

Open this file before writing every post. Following it consistently is what
turns `/insights` into a topical authority on tokenization for Google and
AI search engines (ChatGPT, Perplexity, Claude, Gemini).

---

## 1. The 4-step workflow

1. **Create the file** at `src/content/insights/posts/<slug>.tsx`.
   The filename must match the `slug` field exactly. Use kebab-case.
2. **Copy the template** below into it (see §3).
3. **Register it** — open `src/content/insights/registry.ts`, add two lines:
   ```ts
   import * as mySlug from "./posts/my-slug";
   // ...add `toPost(mySlug)` to the ALL_POSTS array.
   ```
4. **Commit and deploy.** Sitemap, RSS, category page, related-posts widget,
   and Article schema update automatically.

To save as a draft (won't appear in listings, RSS, or sitemap):
add `draft: true` to the metadata.

---

## 2. The metadata that matters (SEO + GEO)

Every field in `metadata` has a job. Fill it deliberately.

| Field | What it controls | How to choose well |
|---|---|---|
| `slug` | URL + filename. Permanent. | Lowercase, kebab-case, ≤60 chars. Include 1 keyword. Example: `mica-stablecoin-update-may-2026`. Don't change after publishing — breaks links. |
| `title` | `<title>` tag, `<h1>`, social cards, AI citation label. | 50–70 chars. Lead with the **claim or take**, not the news event. "X is a compliance problem, not a tech problem" beats "SEC delays exemption." |
| `description` | Google SERP snippet, social preview, RSS summary. | 140–160 chars. Self-contained — read like an answer, not a teaser. Include 1 primary keyword. |
| `publishedAt` | Sitemap `lastmod`, Article schema, freshness signal. | ISO date `YYYY-MM-DD`. Use the actual publish date — Google penalizes back-dated content. |
| `updatedAt` | Refresh signal for re-indexed pages. | Set this when you materially edit a published post. Don't set it for typo fixes. |
| `category` | Routes to `/insights/category/<slug>`. | Pick exactly one. Five options — see §5. |
| `tags` | Powers related-posts widget; appears in Article schema `keywords`. | 3–6 tags. Use **lowercase, hyphenated, stable** vocabulary (e.g. `mica`, `transfer-agent`). Tags are not for SEO — they're for navigation and AI grouping. |
| `author` | Byline + Article schema `author`. | Always `DEFAULT_AUTHOR` for solo posts. Add a new author to `authors.ts` if needed. |
| `readMinutes` | Byline indicator + reader expectation setting. | Word count ÷ 230, rounded. 800 words ≈ 3 min, 1500 words ≈ 6 min. |
| `ogImage` | Social share card. | Optional. 1200×630px under `/public/`. Falls back to the site default. |

---

## 3. Post template (copy this)

```tsx
import type { InsightPost } from "../types";
import { DEFAULT_AUTHOR } from "../authors";
import { Lede, P, H2, H3, UL, OL, LI, Strong, A, Quote, Callout, Sources } from "../_ui";

export const metadata: InsightPost["metadata"] = {
  slug: "my-post-slug",
  title: "Opinionated headline that takes a position",
  description:
    "One self-contained sentence that reads like an answer. 140–160 chars. Includes the topic and the take.",
  publishedAt: "2026-05-23",
  category: "regulation", // regulation | market | tokenization | compliance | product
  tags: ["sec", "mica", "transfer-agent"],
  author: DEFAULT_AUTHOR,
  readMinutes: 3,
};

export default function Body() {
  return (
    <>
      <Lede>
        One sentence that states your take. This is what AI models quote and
        what shows above the fold. Make it stand alone.
      </Lede>

      <P>
        Opening paragraph: what happened, when, where. Cite source up front
        ("According to Bloomberg Law..."). Don't copy source text — summarize.
      </P>

      <H2>Why this is a structural question, not a [surface] one</H2>

      <P>
        Your analytical claim. The part that doesn't appear in the source.
        This is the section AI models will reach for when answering related
        questions, because it's the only place this perspective exists.
      </P>

      <H2>What [the concept] actually means</H2>

      <P>
        Define the abstraction. Use <Strong>bold</Strong> for terms readers
        might search for later. Strong tags are a strong signal to both Google
        and LLMs that the bolded phrase is a key concept on this page.
      </P>

      <Callout label="Where QBridge sits">
        At most one of these per post. Soft tie-in to product — never a sales
        pitch. If you can't justify it in 2 sentences, drop it.
      </Callout>

      <H2>What to watch next</H2>

      <P>
        Forward-looking close. Specific signals to watch — gives the post a
        reason to be revisited. Avoid vague predictions.
      </P>

      <Sources
        items={[
          {
            label: "Headline — Publisher, YYYY-MM-DD",
            url: "https://...",
          },
        ]}
      />
    </>
  );
}
```

---

## 4. Writing style — what to hit in every post

### Length
- **News commentary:** 400–700 words. Fast turnaround beats depth here.
- **Analysis / explainer:** 1000–1500 words. Worth the time investment.
- Anything under 300 words goes in your LinkedIn caption, not on `/insights`.

### Structure (this is the GEO recipe)

AI models cite pages that are **structured like answers**:

1. **Lede** = your one-sentence answer to the implicit question. Models pull this verbatim.
2. **First paragraph** = the supporting context. Cite source by name.
3. **One H2 per section.** Each H2 should be a phrase someone might ask. Examples that work:
   - "Why X is a Y problem, not a Z problem"
   - "What [term] actually means"
   - "How [process] works in practice"
   - "What to watch next"
4. **Short paragraphs** — 2–4 sentences. Long blocks lose both readers and AI parsers.
5. **Sources block at the bottom.** Always. Even for opinion pieces.

### Voice
- First-person *only* if it's a clearly editorial post. Default to neutral third-person.
- Take a position. "X is..." beats "Some argue X may be..." — confidence is a signal.
- No hedging filler ("it's worth noting", "interestingly", "as we'll see"). Cut every one.
- No emoji, no exclamation marks, no rhetorical questions.

### Bolding
Only bold **terms** — concepts a reader might search for or that anchor the
argument (e.g. **transfer-agent integration**, **innovation exemption**).
Never bold for emphasis on adjectives or sentence fragments.

---

## 5. Categories — when to use which

| Category | Use when… |
|---|---|
| `regulation` | Rule changes, agency actions, court rulings, policy proposals (SEC, MiCA, MAS, DFSA, FCA, etc.). |
| `market` | Issuance volumes, capital flows, deal announcements, adoption signals, market structure changes. |
| `tokenization` | Token standards, issuance models, lifecycle operations, technical patterns. |
| `compliance` | Identity, KYC/KYB, transfer controls, sanctions screening, audit, operational mechanics. |
| `product` | QBridge releases, capability deep-dives, behind-the-scenes engineering. Use sparingly. |

If a post fits two categories, pick the one a *reader* would search for. Categories are for human navigation; tags handle the cross-cutting concerns.

---

## 6. UI helpers cheat sheet

Imported from `../_ui`. These are the only typography primitives a post should
use. Don't import or use raw HTML elements.

| Helper | When to use |
|---|---|
| `<Lede>` | Once, immediately after the title. Italic. Your one-line take. |
| `<P>` | Body paragraphs. Default text element. |
| `<H2>`, `<H3>` | Section headers. H2 for major sections, H3 sparingly within. |
| `<UL>` + `<LI>` | Bulleted lists. Use sparingly — prose beats lists. |
| `<OL>` + `<LI>` | Numbered lists for ordered steps or rankings. |
| `<Strong>` | Bold a **key term**. Not for emphasis. |
| `<A href="...">` | Links. Auto-detects external vs internal. |
| `<Quote cite="...">` | Pull-quote (italic Playfair). Use ≤1 per post for impact. |
| `<Callout label="...">` | Aside. "Where QBridge sits", "Why it matters", "Editor's note". ≤1 per post. |
| `<Sources items={...} />` | Always. Bottom of every post. |

Adding a new element type? Add it to `_ui.tsx` once — never inline raw styles in a post.

---

## 7. Internal linking (often forgotten — high-leverage)

For every post, ask:
- **Does this reference a concept covered in an earlier post?** Link to it with `<A href="/insights/older-slug">concept name</A>`.
- **Is there a related category page I should link to?** Example: at the end of a regulation post, "More on **[regulation](/insights/category/regulation)**."

Internal links are how Google understands topical clusters. Three internal
links per post is a good baseline. They also let AI models discover related
content within your domain.

---

## 8. Citation discipline (most important for AI search)

AI models heavily favor content with traceable sources. The rule:

- **Every factual claim that isn't your opinion needs a source.**
- Sources go in the `<Sources>` block at the bottom AND can be linked inline
  using `<A href="...">according to X</A>`.
- Always include the **publisher and date** in the source label, not just
  the URL.
- For primary sources (SEC filings, ESMA guidance, court documents), link
  the primary source — not the news article reporting on it. Both is fine.

Never quote more than ~25 words from another publisher's article. Summarize
in your words. Copy-paste is both copyright infringement and SEO poison
(Google demotes duplicated content).

---

## 9. After publishing — the distribution loop

For every new post, run this sequence. **Order matters.**

### Day 0 — publish day

1. **Verify the post** renders correctly on mobile and desktop at `/insights/<slug>`.
2. **Submit URL to Google Search Console** → "Request indexing". Takes 30
   seconds. Speeds up indexing from days to hours.
3. **Wait at least an hour** before posting to LinkedIn. This gives Google's
   crawler time to see qbridge.one as the canonical source first.
4. **LinkedIn post from your personal profile** (see §9a for the template).
   Personal posts get 3–5× more reach than company-page posts.
5. **Drop the article link as the first comment** on your post immediately.
   Never put the link in the post body — LinkedIn algorithmically downranks
   posts with external links.
6. **Respond to every comment** in the first 60 minutes. Engagement velocity
   in the first hour determines total reach.

### Day 0 + 2–4 hours

7. **Re-share from the QBridge company page** with a short employer-side comment.

### Day +2

8. **Check Search Console** for crawl errors or coverage issues on the new URL.

### Within a week

9. **Internal linking** — if the new post relates to an earlier one, edit the
   earlier post to add an internal link forward. Two-way linking compounds
   topical authority.

### Why this order

- Website → Google → LinkedIn means qbridge.one is established as the
  canonical source before any other platform indexes the content.
- LinkedIn-first means LinkedIn becomes the canonical home and your domain
  gets no SEO credit. **This is the single most common mistake that kills
  early-stage editorial SEO.**

---

## 9a. The LinkedIn post template

LinkedIn favors posts that keep users on LinkedIn. Two algorithmic facts to
exploit:

- Posts with external links in the body get reduced reach. Workaround: put
  the link in the first comment.
- The first 2–3 lines are everything — that's all that shows before "see
  more". The hook must earn the click.

### Structure

```
[HOOK — line 1, ≤120 chars. Makes them click "see more". State the take.]

[CONTEXT — 1–2 lines. What happened, briefly, with the source named.]

[THE ARGUMENT — 2–4 short sentences. Your reframe of the news.]

[CLOSE — 1 line. Implication, prediction, or sharp observation.]

Full analysis in the comments ↓

#Tokenization #RWA #DigitalAssets #Compliance #[1–2 more relevant tags]
```

### Then immediately

**Post a single comment** with the link only:

```
Full piece on QBridge Insights: https://www.qbridge.one/insights/<slug>
```

### Style rules for the LinkedIn caption

- **First person voice.** "I read this as..." or just declarative. Not academic.
- **No headlines or all-caps.** LinkedIn isn't a newspaper.
- **Line breaks between every 1–2 sentences.** Walls of text get scrolled past.
- **No emoji or arrows other than the single `↓`** before "comments".
- **3–6 hashtags max**, in one row at the bottom. Mix big (#Tokenization)
  with niche (#TransferAgent #InnovationExemption).
- **Length:** 700–1500 characters. Long enough to be substantive, short
  enough to read on phone.

### Tagging people / companies

Only if directly relevant. If your post discusses Securitize, Ondo, etc. and
you tag their official handles, you may pull them into the comments — be
prepared for that engagement. Don't tag for visibility alone; LinkedIn's
algorithm punishes tag-spam.

### Best posting time

Tuesday–Thursday, 8–10am or 12pm in your audience's main time zone
(US East Coast for QBridge's tokenization buyer audience). Avoid Mondays,
Fridays, and weekends.

### Image attachment

Attach a branded image to the post (1200×627 LinkedIn-optimal). Posts with
images see ~2× engagement. A simple template: dark navy background, post
headline as text, QBridge logo bottom-right. Reuse the template per post —
your feed becomes visually recognizable over time.

### What NOT to do on LinkedIn

- **Don't paste the full article text into the LinkedIn post.** Duplicates
  the content and dilutes the canonical signal back to your domain.
- **Don't post the same wording on Twitter/X within minutes** — Google
  occasionally treats near-simultaneous posts as duplicate and picks one
  canonical for both, often not yours. Stagger by an hour.
- **Don't edit the post within the first hour** — LinkedIn deprioritizes
  edited posts during the critical engagement window.
- **Don't use "Click here", "Read more", or other CTA-speak** — algorithm
  flags this as low-quality content marketing.

### Re-share schedule

| When | Where | What |
|---|---|---|
| Day 0 (1+ hour after publish) | Your personal LinkedIn | Full template post + link in comments |
| Day 0 + 2–4h | QBridge company page | Re-share with a 1-line comment |
| Day +3 | Your personal profile | "Update" or reply post if there's new development on the topic |
| Day +7 | Your personal profile | Quote-share your original post with new framing if it still gets engagement |

---

## 10. The anti-patterns (Google + AI search will demote these)

- **Copy-pasting a news article.** Even with attribution. Always summarize and add original analysis.
- **AI-generated filler.** Models can detect content from other models. Demoted hard since 2024.
- **Keyword stuffing.** "Tokenization, tokenized assets, tokens, tokenized securities" in the first paragraph. Read like a human.
- **Vague titles.** "Thoughts on the SEC announcement" — no one searches for that.
- **Missing sources.** Unsourced claims tank E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).
- **Back-dating posts.** Google checks first-crawl date against `publishedAt`. Mismatch = demotion.
- **Changing slugs after publishing.** Breaks every external link, kills Google ranking.
- **Republishing content from elsewhere.** Even your own LinkedIn post — if it lives there first, this is the duplicate.

---

## 11. Quick pre-publish checklist

Before you commit, verify:

- [ ] `title` is opinionated, 50–70 chars
- [ ] `description` reads like a self-contained answer, 140–160 chars
- [ ] `slug` is permanent and matches filename
- [ ] `category` is set, `tags` are 3–6 lowercase-hyphenated
- [ ] Opens with `<Lede>` (single sentence, your take)
- [ ] First paragraph cites the source by name
- [ ] At least 2 `<H2>` section headers
- [ ] Paragraphs are 2–4 sentences
- [ ] At least 1 internal link to a related insight or category page
- [ ] `<Sources>` block at the bottom with publisher + date
- [ ] No copy-pasted external text
- [ ] No emoji, exclamation marks, rhetorical questions

---

## 12. Posting cadence (what actually moves rankings)

| Frequency | Why |
|---|---|
| **1 substantive post/week** | The breakpoint where Google starts treating you as a serious publisher in the niche. Consistency matters more than volume. |
| **+ ad-hoc news posts** | Whenever a regulator does something material. Speed = inbound search traffic for fresh queries. |
| **Monthly: refresh 1 older post** | Add new sources, update `updatedAt`. Refreshed content gets re-crawled. |

Three months of weekly + ad-hoc news posts is the minimum runway to start
showing up consistently for tokenization queries. Six months and you'll be
quoted in news roundups and AI search answers.
