# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Convention: every meaningful change lands here under `[Unreleased]` before (or
> with) its commit. Keep entries short — one line of _what_ + _why_. Cut a dated
> version section when the live site materially changes.

## [Unreleased]

### Added
- **Governance layer (control tower).** Added `docs/control/` (CONTROL_TOWER,
  RAID, ROADMAP, NEXT_SESSION_PROMPT, README), `docs/adr/` (ADR-001..005 capturing
  decisions already made), `docs/worklog/`, and this CHANGELOG — mirroring the
  trading-system's discipline, right-sized for a landing site.
- **Full backlog tracked (S-01..S-19)** in [RAID §I](docs/control/RAID.md) +
  [ROADMAP](docs/control/ROADMAP.md): content (publish 1st post, real socials),
  SEO (OG image, analytics, ES 404), infra (www redirect, Hobby→Pro, blog
  subdomain), and governance (repo description/topics, LICENSE, account-id
  disclosure decision) items.

### Changed
- **Repo public hygiene (S-07).** Set the GitHub repo description + 13 topics
  (astro, sre, reliability-engineering, devops, cloud, i18n, …) and pointed the
  homepage at `https://mizolutions.com` (was the Vercel preview URL).
- **Repository flipped to public** (build-in-public) at the operator's request.
  Recorded as RAID D-06; the now-public control docs reference the AWS account-id
  and Route53 zone-id (RAID R-07) — a conscious accept/redact decision is tracked
  as S-11. Fixed the README license section (was "Private").

## [0.1.0] — 2026-06-16

Initial public landing, live on `https://mizolutions.com`.

### Added
- **Astro 5 static landing**, dark-mode, hand-written CSS design tokens, zero JS
  shipped by default.
- **Bilingual EN/ES** via Astro i18n (`/` English, `/es` Spanish); all copy
  centralized in `src/i18n/ui.ts`.
- **Sections:** Hero, Services (Cloud / SRE-Observability / IaC), Trinitrade case
  study (redacted SVG/CSS dashboard mocks), Methodology, Newsletter (Buttondown
  embed), Footer.
- **Blog** via Content Collections; first post _"From storing logs to real
  observability"_ (EN+ES) shipped as a draft.
- **SEO:** canonical + hreflang (en/es/x-default), Open Graph/Twitter tags,
  sitemap, `robots.txt`, typographic SVG favicon.
- **Security headers** via `vercel.json`: HSTS, strict CSP, `X-Frame-Options`,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy`.

### Infrastructure
- **Repo** `mizolutions/site` (private), deployed on **Vercel** (static).
- **DNS:** `mizolutions.com` apex `A → 216.198.79.1` in the Route53 zone
  `Z062327723TCUEVA9TY8M` (production trading account, separate from `miz0.com`);
  zone kept in Route53, **not** delegated to Vercel. SSL auto-issued by Vercel.

### Positioning
- Consultancy-led (SRE / Cloud / IaC); Trinitrade framed strictly as a
  **reliability case study** — no P&L / performance claims.
- Cloud-general branding (no AWS-specific lock-in in the copy).
