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

- **[Content] Publicar 1er post del blog** — revisar borrador EN+ES, flip `draft:false` (S-01).
- **[Content] Identidad real** — socials + email en `src/consts.ts` (S-02).
- **[Growth] Newsletter** — username Buttondown real + probar el form (S-03).

## ⏭️ Next (semanas)

- **[SEO] OG image** — generar imagen Open Graph + cambiar `twitter:card` a `summary_large_image` (S-04).
- **[Analytics] Vercel Web Analytics** — activar (sin cookies → sin banner) (S-04).
- **[Infra] Plan Pro** — evaluar pasar Vercel Hobby → Pro (uso comercial, R-02).
- **[Content] 2º–3er post** — cadencia de blog técnico (post-mortems, arquitectura).

## 🌅 Later (cuando aplique)

- **[Infra] `blog.mizolutions.com`** — decidir redirect a `/blog` vs proyecto Astro propio (S-05).
- **[Producto] `app.mizolutions.com`** — si nace el SaaS de señales, va como proyecto Next.js **separado** (no acoplar a la landing).
- **[Growth] Página de servicios / "trabajemos"** — formulario o Cal.com para el CTA primario.
- **[Gov] GitHub Project** — si el backlog supera ~10 ítems vivos, montar un board (hoy markdown basta, D-03).

## Principios de priorización

1. **El sitio nunca roto para visitantes** > features nuevas.
2. **Build in public**: contenido técnico real > pulido cosmético infinito.
3. **Minimalismo**: cada sección/feature debe justificar su peso (ingeniería sobre diseño).
4. **Aislamiento**: la landing no se acopla a la infra del trading ni al SaaS futuro.
