# 🎛️ Control Tower — mizolutions.com

> **Propósito:** página única que responde en 30 segundos *"¿cómo está el sitio
> hoy y qué exige mi atención?"*
> **Owner:** tú (single operator). **Cadencia:** actualizar al inicio Y al cierre
> de cada sesión que toque el sitio.
>
> **Última actualización:** 2026-06-16 (repo flipeado a **público** [build-in-public] +
> **backlog completo poblado: 19 tareas S-01..S-19** en [RAID §I](RAID.md) +
> [ROADMAP](ROADMAP.md)) — **el sitio está LIVE en `https://mizolutions.com`**
> (Astro 5 estático en Vercel, bilingüe EN/ES, DNS Route53 → Vercel + SSL auto).
> Repo `mizolutions/site` (**público**), `main` = `fe6925e`. **0 incidencias
> bloqueantes; 19 tareas de pulido/crecimiento en backlog.**
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
| 1 | **Site / Deploy** | 🟢 | build verde · deploy Ready | Vercel **Ready**, `main`=`fe6925e`, Astro 5 estático, `npm run build` verde (5 páginas + sitemap), `astro check` 0/0/0 | tú |
| 2 | **Content / Blog** | 🟡 | # posts publicados · copy fresco | Landing EN+ES completa. **Blog: 1 post en `draft:true`** (S-01). Socials/email placeholder (S-02). 404 solo EN (S-06) | tú |
| 3 | **Infra / DNS / SSL** | 🟢 | dominio Valid · SSL · zona aislada | `mizolutions.com` **Valid**, `A→216.198.79.1` (Route53 `Z062327723TCUEVA9TY8M`), SSL auto. `www` pendiente (S-09); Hobby→Pro a decidir (S-08) | tú |
| 4 | **SEO / Analytics / Growth** | 🟡 | sitemap · meta · analytics · newsletter | SEO base OK (canonical+hreflang+OG+sitemap+robots). **Pendiente:** OG image (S-04), Analytics OFF (S-05), newsletter sin username real (S-03), CTA→mailto (S-12) | tú |
| 5 | **Security / Deps** | 🟢 | headers · npm audit | CSP+HSTS+headers vía `vercel.json`. `npm audit`: 3 highs **aceptados** (no aplican a build estático). **Repo público** → account-id/zone-id en docs (R-07, decisión S-11) | tú |
| 6 | **Governance / Repo** | 🟡 | description · topics · backlog | Repo **público** sin description/topics; README dice "Private" (S-07). LICENSE a decidir (S-13). Backlog 19 tareas trackeadas | tú |

> **Regla del semáforo:** 🔴 = el sitio está caído o roto para visitantes; 🟡 =
> deuda conocida con plan; 🟢 = ningún pendiente bloqueante; ⚪ = sin medir.

---

## 2. Top-3 que exige tu atención

> Ordenado por impacto × oportunidad. Nada es bloqueante (el sitio está sano);
> son los siguientes pasos. Backlog completo (S-01..S-19) en [RAID §I](RAID.md) +
> [ROADMAP](ROADMAP.md).

1. **Publicar el primer post del blog (S-01)** — revisar el borrador (EN+ES) y
   flipear `draft:false`. Es el motor del "build in public", y ahora que el repo
   es público pesa más. Dominio: Content.
2. **Higiene del repo público (S-07 + S-11)** — description + topics de GitHub,
   arreglar el README que aún dice "Private", y **decidir conscientemente** sobre
   el account-id/zone-id ya visibles en docs (R-07). Dominio: Gov/Seguridad.
3. **Cerrar identidad + decidir hosting (S-02 + S-08)** — socials/email reales en
   `src/consts.ts`; decidir Vercel Hobby→Pro (uso comercial). Dominio: Content/Infra.

---

## 3. Estado técnico de referencia

| Hecho | Valor |
|---|---|
| Repo | `mizolutions/site` (**público**, build-in-public), `main` = `fe6925e` |
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
| 2026-06-16 | Repo → público; backlog completo (S-01..S-19) poblado en RAID + ROADMAP | `fe6925e` |

> Detalle por sesión en [../worklog/](../worklog/). Decisiones en [../adr/index.md](../adr/index.md).
