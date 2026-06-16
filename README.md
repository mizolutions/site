# mizolutions.com

Marketing + case-study site for **Mizolutions** — a senior SRE / reliability
engineering consultancy. Static, dark-mode, bilingual (EN/ES). Built with Astro,
deployed on Vercel.

> Positioning: this site sells **engineering services**. `Trinitrade` (the
> algorithmic trading platform) appears only as a **reliability case study** —
> never as a financial product, and with **no performance/P&L claims**. Keep it
> that way; it is what protects the brand and stays clear of regulatory framing.

- **Public brand / this site:** `mizolutions.com` — registered in **Route53
  (production trading account)**; hosted on Vercel via two DNS records (see
  [DNS](#dns)).
- **Technical domain (backend, dashboards, API):** `miz0.com` — managed
  separately in Route53/CDK, **not touched by this repo**.
- **Blog:** `blog.mizolutions.com` (see [DNS](#dns) for the mapping).

---

## Stack

- [Astro](https://astro.build) (`output: 'static'`) — zero JS shipped by default.
- Hand-written CSS with design tokens (no Tailwind, no UI framework).
- Built-in i18n routing: English at `/`, Spanish under `/es`.
- Content Collections for the blog (Markdown + typed frontmatter).
- `@astrojs/sitemap` for `sitemap-index.xml`.
- Security headers + caching via [`vercel.json`](./vercel.json).

## Quick start

```bash
nvm use            # Node 20 (see .nvmrc)
npm install
npm run dev        # http://localhost:4321
```

| Script            | Action                                  |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Local dev server                        |
| `npm run build`   | Production build to `dist/`             |
| `npm run preview` | Serve the built `dist/` locally         |
| `npm run check`   | `astro check` (TypeScript + templates)  |

## Project structure

```
src/
  consts.ts            Brand metadata, socials, contact + newsletter config
  i18n/ui.ts           ALL copy, EN + ES (single source of truth) + helpers
  styles/
    tokens.css         Design tokens (color, type scale, spacing)
    global.css         Base/reset + utilities (.container, .btn, .prose, ...)
  layouts/Base.astro   <html> shell: head + header + footer
  components/          Header, Footer, LangSwitch, Hero, Services,
                       CaseStudy, Methodology, Newsletter, BaseHead
  content/
    config.ts          Blog collection schema
    blog/*.md          Posts (frontmatter: title, description, pubDate, lang,
                       tags, draft)
  pages/
    index.astro        EN home          /
    es/index.astro     ES home          /es
    blog/              EN blog          /blog, /blog/[slug]
    es/blog/           ES blog          /es/blog, /es/blog/[slug]
    404.astro
public/                favicon.svg, robots.txt (static, copied as-is)
```

## Editing content

- **All on-page copy** lives in [`src/i18n/ui.ts`](./src/i18n/ui.ts) under
  `ui.en` and `ui.es`. Edit there — components read from it.
- **Brand / links / contact:** [`src/consts.ts`](./src/consts.ts).
- **Accent color & type:** [`src/styles/tokens.css`](./src/styles/tokens.css)
  (`--accent`, the font stacks, the fluid scale).

### Add a blog post

1. Create `src/content/blog/my-post.md` (EN) and/or a Spanish counterpart.
2. Frontmatter:
   ```yaml
   ---
   title: '...'
   description: '...'
   pubDate: 2026-07-01
   lang: 'en' # or 'es'
   tags: ['observability']
   draft: true # hidden from listings & not built in production
   ---
   ```
3. Flip `draft: false` to publish. Drafts are visible in `npm run dev` but
   excluded from production builds.

The first post (`logs-to-observability` / `de-logs-a-observabilidad`) ships as a
**draft** — review, then un-draft.

## Deploy to Vercel

1. Push this repo to `github.com/mizolutions/site` (private).
2. In Vercel → **Add New → Project → Import** the repo. Framework is
   auto-detected as **Astro**; build settings come from
   [`vercel.json`](./vercel.json). No changes needed.
3. (Optional) **Environment variables** (Project → Settings → Environment
   Variables), all optional — sane defaults exist in `src/consts.ts`:
   - `PUBLIC_BUTTONDOWN_USERNAME` — your Buttondown username for the newsletter.
   - `PUBLIC_CONTACT_HREF` — `mailto:` or a Cal.com link for the primary CTA.
4. Every push to `main` → production deploy. Every PR → a preview URL
   (great for build-in-public).

> **Cost / ToS note:** Vercel's **Hobby** plan is non-commercial. A consultancy
> site is commercial use → use **Vercel Pro**. If you want strictly free hosting
> for commercial use, Cloudflare Pages is a drop-in static alternative.

## DNS

`mizolutions.com` is registered in **AWS Route53 (Route53 Domains) in the
production trading account** (`520999258244`) — the same account that owns
`miz0.com`. Registration auto-created a **dedicated hosted zone** for
`mizolutions.com`, which is **separate** from the `miz0.com` zone. Keep it that
way — a distinct zone is a distinct failure domain. Do **not** add these records
to the `miz0.com` zone, and do **not** wire them into the trading-system CDK
stacks (a trading deploy must never be able to touch the landing's DNS).

**Recommended: keep the zone in Route53, point it at Vercel with an A record.**
The registrar _is_ Route53, so leave the nameservers on Route53 (do **not**
delegate to Vercel via the "Vercel DNS / nameservers" tab) and just add the
record Vercel asks for under **Project → Settings → Domains → DNS Records**.

**Applied 2026-06-16** (zone `Z062327723TCUEVA9TY8M`, apex only — this is what
Vercel currently requests):

| Record                 | Type | Value           | TTL |
| ---------------------- | ---- | --------------- | --- |
| apex `mizolutions.com` | `A`  | `216.198.79.1`  | 300 |

> Vercel's newer apex IP is `216.198.79.1` (the older `76.76.21.21` and
> `cname.vercel-dns.com` still work but are deprecated). Always use the value
> Vercel shows you under **DNS Records**; do not use the **Vercel DNS** tab
> (that delegates the whole zone). `www` is not required unless you add it as a
> domain in Vercel (it will then ask for `CNAME www → cname.vercel-dns.com`).

Applied with the Route53 API from a host with the `trading` profile:

```bash
~/bin/dc-aws 'AWS_PROFILE=trading aws route53 change-resource-record-sets \
  --hosted-zone-id Z062327723TCUEVA9TY8M \
  --change-batch "{\"Changes\":[{\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"mizolutions.com.\",\"Type\":\"A\",\"TTL\":300,\"ResourceRecords\":[{\"Value\":\"216.198.79.1\"}]}}]}"'
# verify: dig +short mizolutions.com A   ->   216.198.79.1
# then click Refresh on the domain in Vercel; Invalid -> Valid + auto SSL.
```

Manage these records by hand (or in a small dedicated CDK stack later) — **not**
inside the trading-system infra. Vercel issues SSL automatically once the record
resolves.

### Blog subdomain

The blog is served at `mizolutions.com/blog` (all internal links are
root-relative, so this is the robust, footgun-free path). For
`blog.mizolutions.com`, add it in Vercel and either:

- **Simplest (recommended for v1):** set it to **redirect** to
  `mizolutions.com/blog`, and add a `CNAME blog → cname.vercel-dns.com` record in
  the Route53 zone. The subdomain resolves and is shareable; canonical tags
  already point at the apex.
- **Later, if the blog grows:** split it into its own Astro project deployed on
  the subdomain. Cleaner independent deploys than host-based rewrites.

## Security

[`vercel.json`](./vercel.json) sets HSTS, a strict CSP (self + inline styles that
Astro requires; `form-action` allows `buttondown.email`), `X-Frame-Options:
DENY`, `nosniff`, a tight `Referrer-Policy`, and `Permissions-Policy`. If you add
a third-party embed, update the CSP `connect-src` / `form-action` accordingly.

### Screenshot sanitization checklist (before adding real captures)

Build-in-public is not leak-in-public. For any Grafana / CloudWatch / code image:

- [ ] No account balances / equity / P&L figures.
- [ ] No account IDs, ARNs, internal hostnames, IPs, or API keys.
- [ ] No customer/PII data.
- [ ] Strip EXIF metadata.
- [ ] Prefer the CSS/SVG mock panels already in `CaseStudy.astro` until you have
      clean, redacted captures.

### Dependency audit posture

`npm audit` reports a few advisories (including "high") in `astro` / `esbuild` /
`vite`. They are **accepted — not applicable to this deployment**:

- This site is `output: 'static'` on Vercel: no SSR server, no middleware, no
  server islands, no `define:vars` inline scripts. The Astro advisories
  (`define:vars` XSS, server-island replay, header/middleware bypasses) target
  features we do not use.
- The `esbuild` / `vite` advisories are **dev-server only** (several are
  Windows/Deno specific). The dev server is local and never exposed.

`npm audit fix --force` would install an **Astro 7 alpha** (the advisory range is
`<=7.0.0-alpha.1`, with no fixed stable release yet) — strictly riskier than the
non-applicable findings. **Revisit** when a stable Astro release marks these
fixed, or before adopting SSR / server islands.

## License

Public repository (build-in-public), **no open-source license** — all rights
reserved. © Mizolutions. The source is viewable, but reuse/redistribution is not
granted (a brand/marketing site is not meant to be forked). An explicit license
decision is tracked as **S-13** in [docs/control/RAID.md](docs/control/RAID.md).
