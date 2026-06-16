# 🎛️ Control Tower — mizolutions.com

> **Propósito:** página única que responde en 30 segundos *"¿cómo está el sitio
> hoy y qué exige mi atención?"*
> **Owner:** tú (single operator). **Cadencia:** actualizar al inicio Y al cierre
> de cada sesión que toque el sitio.
>
> **Última actualización:** 2026-06-16 (bootstrap) — **el sitio está LIVE en
> `https://mizolutions.com`** (Astro 5 estático en Vercel, bilingüe EN/ES, DNS
> Route53 → Vercel resuelto + SSL auto). Repo `mizolutions/site` (privado),
> `main` = `931bd55`. Se montó esta capa de control (CONTROL_TOWER + RAID + ADRs
> 001-005 + CHANGELOG + worklog). **0 incidencias abiertas.**
>
> **🟢 Sesión 2026-06-16 (bootstrap) — landing live + torre de control.** (1)
> Scaffolding Astro 5 estático (dark, bilingüe, tokens CSS a mano, cero JS),
> secciones Hero/Servicios/Caso-Trinitrade/Método/Newsletter, blog con 1 post en
> borrador, headers de seguridad + sitemap. (2) Copy reposicionado de "AWS" a
> "Cloud" (branding cloud-general). (3) Repo `mizolutions/site` creado (privado)
> + push con el PAT existente. (4) Deploy en Vercel OK (Ready). (5) DNS: `A
> mizolutions.com → 216.198.79.1` aplicado en la zona Route53 `Z062327723TCUEVA9TY8M`
> (cuenta PROD trading, zona separada de `miz0.com`, sin delegar NS a Vercel) →
> dominio Valid + SSL auto. (6) Esta torre de control.

---

## 1. Semáforo por dominio

Estado: 🟢 OK · 🟡 atención · 🔴 acción inmediata · ⚪ sin datos

| # | Dominio | Estado | KPI primario | Valor actual | Owner |
|---|---|---|---|---|---|
| 1 | **Site / Deploy** | 🟢 | build verde · deploy Ready | Vercel **Ready**, `main`=`931bd55`, Astro 5 estático, `npm run build` verde (5 páginas + sitemap), `astro check` 0/0/0 | tú |
| 2 | **Content / Blog** | 🟡 | # posts publicados · copy fresco | Landing EN+ES completa. **Blog: 1 post en `draft:true`** (logs→observability) — pendiente publicar. Socials/email en `src/consts.ts` aún placeholder | tú |
| 3 | **Infra / DNS / SSL** | 🟢 | dominio Valid · SSL · zona aislada | `mizolutions.com` **Valid**, `A→216.198.79.1` (Route53 `Z062327723TCUEVA9TY8M`), SSL auto Vercel. Zona separada de `miz0.com` y del trading-system | tú |
| 4 | **SEO / Analytics / Growth** | 🟡 | sitemap · meta · analytics · newsletter | SEO base OK (canonical+hreflang+OG+sitemap+robots). **Pendiente:** OG image (hoy `summary` sin imagen), Vercel Analytics OFF, newsletter Buttondown sin username real | tú |
| 5 | **Security / Deps** | 🟢 | headers · npm audit | CSP+HSTS+nosniff+frame-deny+referrer+permissions vía `vercel.json`. `npm audit`: 3 highs **aceptados** (no aplican a build estático; ver README §audit) | tú |

> **Regla del semáforo:** 🔴 = el sitio está caído o roto para visitantes; 🟡 =
> deuda conocida con plan; 🟢 = ningún pendiente bloqueante; ⚪ = sin medir.

---

## 2. Top-3 que exige tu atención

> Ordenado por impacto × esfuerzo. Nada de esto es bloqueante (el sitio está sano);
> son los siguientes pasos de pulido/crecimiento.

1. **Publicar el primer post del blog** — revisar el borrador (EN+ES) y flipear
   `draft: false` en `src/content/blog/*.md`. Es el motor del "build in public".
   Dominio: Content. _(ver [ROADMAP](ROADMAP.md) → Now)_
2. **Cerrar identidad/placeholders** — rellenar socials/email reales en
   `src/consts.ts` y conectar el username de Buttondown (newsletter). Dominio:
   Content/Growth.
3. **OG image + Analytics** — generar una imagen Open Graph (hoy `twitter:card=
   summary` sin imagen) y activar Vercel Web Analytics (sin cookies → sin banner).
   Dominio: SEO/Analytics.

---

## 3. Estado técnico de referencia

| Hecho | Valor |
|---|---|
| Repo | `mizolutions/site` (privado), `main` = `931bd55` |
| Local | `/home/dc-user/workspace/mizolutions-site` (sibling del trading-system, **fuera** del workspace VS Code) |
| Stack | Astro 5 estático, TypeScript, CSS tokens a mano, i18n EN/ES |
| Hosting | Vercel (plan **Hobby** — ⚠️ uso comercial pide **Pro** por ToS) |
| Dominio | `mizolutions.com` → `A 216.198.79.1` (Vercel), zona Route53 `Z062327723TCUEVA9TY8M` en cuenta PROD trading `520999258244` |
| Dominio técnico | `miz0.com` = backend/dashboards (Route53/CDK del trading-system) — **NO se toca desde aquí** |
| Build | `npm run build` (5 páginas + sitemap), `npm run dev` (preview), `npx astro check` (tipos) |
| Deploy | push a `main` → deploy de producción automático en Vercel |

---

## 4. Bitácora de sesiones (resumen)

| Fecha | Resumen | `main` |
|---|---|---|
| 2026-06-16 | Bootstrap: landing Astro 5 live + DNS Route53→Vercel + torre de control | `931bd55` |

> Detalle por sesión en [../worklog/](../worklog/). Decisiones en [../adr/index.md](../adr/index.md).
