# 🧱 Blog post template & visual system

> **Purpose:** a copy-paste skeleton + the reusable "visual blocks" so every article in
> [BLOG_PLAN.md](BLOG_PLAN.md) looks consistent and polished without reinventing anything.
> **Owner:** Misael. **Established:** 2026-06-23 (reference implementation: post E1
> `no-trading-edge-seven-strategies`).

---

## 1. File layout per article

| What | Where |
|---|---|
| English post | `src/content/blog/<slug-en>.md` |
| Spanish post | `src/content/blog/<slug-es>.md` (different slug per language, e.g. `de-...` / `sin-...`) |
| Diagrams (SVG) | `public/blog/<slug-en>/<name>.svg` (both languages reference the same EN-slug folder) |

> Both language files are separate posts (the loader filters by the `lang` field). Keep one
> diagrams folder per article, named after the **EN slug**, and reference it from both languages.

## 2. Frontmatter (required schema)

```yaml
---
title: 'Punchy, specific title — a promise the post keeps'
description: 'One sentence, 150–160 chars, keyword-bearing (this is the SEO meta description).'
pubDate: 2026-06-30        # the release day; keep draft:true until then
lang: 'en'                 # 'en' or 'es'
draft: true                # true = hidden in prod, visible in `npm run dev`. Flip to false to publish.
tags: ['tag1', 'tag2', 'tag3']   # 3–5 lowercase tags; reuse existing where possible
---
```

## 3. Structure (deep-dive, 1500–2500 words)

1. **Hook** (2–3 sentences): a concrete pain or a counter-intuitive claim. No throat-clearing.
2. **The setup**: anchor in Trinitrade and state the real question.
3. **3–6 body sections** (`##`): one idea each. Lead with the takeaway, then the detail.
4. **The bridge** (`## Why a hiring manager should care` / `## Por qué le importa…`): connect the
   war-story to senior judgment / production reliability. This is the differentiator — keep it.
5. **`## References & further reading`**: external (credible) + internal (mizolutions) links.
6. **Closing italic note**: one-line attribution linking the case study + repo.

## 4. Visual blocks (copy-paste)

> **Density rule:** as many diagrams as genuinely help, but each must earn its place. The text carries
> the narrative; visuals are *proof*, not decoration. A callout should mark the single biggest takeaway.

### Diagram (static SVG, dark theme)

Author a `.mmd` (Mermaid) file, render it once, commit the SVG. The `.prose` CSS styles the figure.

```bash
# 1) write the diagram source, e.g. /tmp/d/funnel.mmd  (plain Mermaid, NO %%{init}%% directive)
# 2) render to the post's public folder:
scripts/render-mermaid.sh /tmp/d/funnel.mmd public/blog/<slug-en>/funnel.svg
```

Then embed it:

```html
<figure>
  <img src="/blog/<slug-en>/funnel.svg" alt="Descriptive alt text for accessibility and SEO" loading="lazy" />
  <figcaption>A one-line caption that states what the diagram proves.</figcaption>
</figure>
```

Mermaid tips (Kroki renderer): avoid the `%%{init}%%` directive (it 400s — the script passes the dark
theme via the API). Avoid emoji and `✓/✗` in node text. Keep node labels short to avoid clipping; use
`<br/>` for line breaks. The script themes everything to match the site automatically.

### Callout — mark the key insight (or a warning)

Use raw HTML with `<strong>`/`<em>` (not markdown) inside, so it renders reliably:

```html
<aside class="callout callout--key">
  <span class="callout__label">Key insight</span>
  <p>The single most important takeaway, in one or two sentences. Use <strong>bold</strong> and
  <em>italics</em> as HTML tags here.</p>
</aside>
```

For a caveat, use `callout--warn` and a label like `Watch out`.

### Table

Plain GFM Markdown tables are styled by `.prose` automatically:

```markdown
| Column | Verdict |
|---|---|
| Thing A | NO-GO |
```

### Code

Fenced code blocks get Shiki syntax highlighting out of the box. Keep snippets ≤ ~20 lines and link
"full file on GitHub" to the sanitized public repo.

### References & further reading

Mix credible external sources with your own material:

```markdown
## References & further reading

- [Concept on Wikipedia](https://en.wikipedia.org/wiki/...) — one-line why it matters.
- Author & Author (year), "Paper title," *Journal* — name seminal papers (no fragile DOIs).

From my own work on **Trinitrade**:

- The full [Trinitrade case study](/trinitrade).
- The sanitized [public repository](https://github.com/mizolutions/trinitrade).
- [About me](/misael).
```

> For the **ES** post, link the Spanish routes (`/es/trinitrade`, `/es/misael`) and Spanish Wikipedia
> where a good article exists.

## 5. Pre-publish checklist

- [ ] EN + ES both written, same structure, links point to the right locale.
- [ ] Diagrams rendered to `public/blog/<slug-en>/` and embedded with alt + caption.
- [ ] One key-insight callout.
- [ ] References section (external + mizolutions).
- [ ] `npx astro check` → 0/0/0 and `npm run build` clean.
- [ ] Read-through in `npm run dev` (drafts visible) — screenshot the diagrams/callout.
- [ ] No secrets, no P&L/returns claims. Every number traceable.
- [ ] To publish: set `draft: false` + `pubDate` to the release day, push → Vercel.

## 6. Honesty & sanitization (non-negotiable)

Same rules as the case study (site ADR-002): never publish AWS account IDs, ARNs, keys, balances, or
returns/P&L claims. Reuse the already-sanitized public repo for code links. Write candidly about
failures and footguns — that candor is the brand.
