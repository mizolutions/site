# 🗺️ Roadmap — mizolutions.com

> Mirror humano y legible del backlog. **Now / Next / Later.**
> Fuente de verdad de estado: [CONTROL_TOWER.md](CONTROL_TOWER.md) + [RAID.md](RAID.md).
> **Última actualización:** 2026-06-16.

## ✅ Done (hitos)

- Landing Astro 5 estática, dark, bilingüe EN/ES, secciones completas.
- Copy reposicionado a branding cloud-general.
- Repo `mizolutions/site` (privado) + deploy en Vercel (Ready).
- DNS Route53 → Vercel (`A 216.198.79.1`) + SSL auto → `https://mizolutions.com` LIVE.
- Capa de control (CONTROL_TOWER, RAID, ROADMAP, ADRs 001-005, CHANGELOG, worklog).

## 🔜 Now (esta/próxima sesión)

> Lo más alto en impacto × oportunidad, sobre todo ahora que el repo es **público**.

- **[Content] S-01 — Publicar 1er post del blog** (flip `draft:false`, EN+ES). Motor del build-in-public.
- **[Content] S-02 — Identidad real** (socials + email en `src/consts.ts`; verificar que los handles existan).
- **[Gov] S-07 — Higiene del repo público** (description + topics de GitHub; arreglar README "Private"→público).
- **[Seguridad] S-11 — Decisión account-id/zone-id** en docs públicos (aceptar vs redactar a futuro; ver R-07).
- **[Infra] S-08 — Decisión Vercel Hobby → Pro** (uso comercial; o evaluar Cloudflare Pages).

## ⏭️ Next (semanas)

- **[Growth] S-03 — Newsletter Buttondown** (username real + probar alta).
- **[SEO] S-04 — OG image** 1200×630 + `twitter:card=summary_large_image`.
- **[Analytics] S-05 — Vercel Web Analytics** (sin cookies).
- **[i18n] S-06 — Página 404 en ES**.
- **[DNS] S-09 — `www.mizolutions.com`** redirect al apex.
- **[Growth] S-12 — CTA "Book a reliability review"** → Cal.com (o mantener `mailto:`).
- **[Gov] S-13 — Decisión de LICENSE** del repo público.

## 🌅 Later (cuando aplique)

- **[Infra] S-10 — `blog.mizolutions.com`** (redirect a `/blog` vs proyecto Astro propio).
- **[SEO] S-14 — `apple-touch-icon` / PNG favicon** fallback (iOS/legacy).
- **[Content] S-15 — Cadencia de blog** (2º/3er post: post-mortems, arquitectura).
- **[Gov] S-16 — CI mínimo** (astro check + build en PR).
- **[Producto] S-17 — `app.mizolutions.com`** (SaaS de señales, proyecto Next.js **separado**).
- **[Growth] S-18 — Página de servicios / contacto** (form o Cal.com).
- **[Gov] S-19 — GitHub Project** si el backlog supera ~10 ítems vivos (hoy markdown basta, D-03).

## Principios de priorización

1. **El sitio nunca roto para visitantes** > features nuevas.
2. **Build in public**: contenido técnico real > pulido cosmético infinito.
3. **Minimalismo**: cada sección/feature debe justificar su peso (ingeniería sobre diseño).
4. **Aislamiento**: la landing no se acopla a la infra del trading ni al SaaS futuro.
