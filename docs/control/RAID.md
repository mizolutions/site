# 📋 RAID Log — mizolutions.com

> **R**isks · **A**ssumptions · **I**ssues · **D**ecisions
> Tabla viva. Actualizar en cada cierre de sesión si hubo cambios.
> Si un ítem lleva > 30 días sin movimiento, re-evaluar o cerrar.
> **Última actualización:** 2026-06-16 (bootstrap del sitio + esta capa de control)

---

## R — Risks (cosas que PODRÍAN pasar)

| ID | Riesgo | Dominio | Prob | Impacto | Mitigación actual | Estado |
|---|---|---|---|---|---|---|
| R-01 | El sitio menciona Trinitrade y alguien lo lee como oferta de inversión / claim de retorno | Marca/Legal | Baja | Alto | Posicionamiento de consultoría, Trinitrade = **caso de estudio** sin P&L (ADR-002); copy auditado | activo |
| R-02 | Vercel plan Hobby es no-comercial; un sitio de consultoría es uso comercial → posible aviso/bloqueo por ToS | Infra/Legal | Media | Bajo | Pasar a **Vercel Pro** ($20/mo) cuando convenga; alternativa Cloudflare Pages (gratis, permite comercial) | aceptado |
| R-03 | Capturas reales de Grafana/CloudWatch filtran datos sensibles (equity, ARNs, hostnames, PII) | Seguridad/Marca | Media | Alto | Hoy se usan **mocks SVG/CSS** redactados; checklist de sanitización en README antes de subir capturas reales | mitigado |
| R-04 | La zona Route53 de `mizolutions.com` vive en la cuenta PROD del trading → un error de DNS podría tocar registros vecinos | Infra | Baja | Medio | Zona **separada** (`Z062327723TCUEVA9TY8M`) de `miz0.com`; cambios manuales y revisados; NO en el CDK del trading (ADR-004) | mitigado |
| R-05 | `npm audit` reporta CVEs (incl. high) en astro/esbuild/vite | Seguridad/Deps | Cierta | Bajo | No aplican al build estático (sin SSR/server-islands/dev-server expuesto); documentado en README §audit; revisitar al subir a un Astro estable que los marque fixed | aceptado |
| R-06 | Operador único = SPOF; el sitio puede quedar desactualizado entre rachas de trabajo | Producto | Media | Bajo | Esta torre de control + NEXT_SESSION_PROMPT bajan el costo de retomar | aceptado |

---

## A — Assumptions (cosas que ASUMIMOS verdaderas)

| ID | Supuesto | Validación | Estado |
|---|---|---|---|
| A-01 | El ICP (CTOs/Tech-Leads/Founders) es bilingüe; EN como default + ES cubre LATAM | Revisar analytics por locale tras 30 días | pendiente |
| A-02 | El blog técnico ("build in public") genera más confianza/leads que un sitio estático puro | Medir suscripciones + tráfico a `/blog` | pendiente |
| A-03 | Vercel estático en edge es suficiente; no hace falta SSR ni backend para la landing | Vigente mientras no haya app/auth (eso iría en `app.mizolutions.com`, proyecto aparte) | vigente |
| A-04 | Mantener la zona DNS en Route53 (sin delegar a Vercel) es la opción correcta de aislamiento | Funciona hoy (dominio Valid + SSL); revisar si Vercel pide nameservers para alguna feature | validado a 06/2026 |

---

## I — Issues (cosas abiertas ahora)

> Hoy el tracking es markdown-only (no hay GitHub Project para el sitio todavía;
> ver D-03). Cuando crezca, sincronizar con `gh issue list` del repo `site`.

| ID | Título corto | Dominio | Prioridad | Notas |
|---|---|---|---|---|
| S-01 | Publicar 1er post del blog (flip `draft:false`) | Content | P2 | Borrador EN+ES listo; revisar y publicar |
| S-02 | Rellenar socials/email reales en `src/consts.ts` | Content | P2 | Hoy placeholders (`hello@mizolutions.com`, github/linkedin/x genéricos) |
| S-03 | Conectar newsletter (username Buttondown real) | Growth | P3 | `PUBLIC_BUTTONDOWN_USERNAME` en Vercel o `src/consts.ts` |
| S-04 | OG image + Vercel Web Analytics | SEO | P3 | Hoy `twitter:card=summary` sin imagen; analytics OFF |
| S-05 | Decidir `blog.mizolutions.com` (redirect vs proyecto propio) | Infra/Content | P3 | Hoy el blog vive en `/blog`; subdominio opcional (ADR futuro) |

---

## D — Decisions (decisiones tomadas, con fecha)

| ID | Fecha | Decisión | ADR |
|---|---|---|---|
| D-01 | 2026-06-15 | Posicionamiento = **consultoría SRE/Cloud**; Trinitrade = caso de estudio sin P&L | [ADR-002](../adr/002-consultancy-positioning-trinitrade-case-study.md) |
| D-02 | 2026-06-15 | Stack = **Astro estático** (no Next.js) en Vercel; bilingüe EN/ES | [ADR-001](../adr/001-static-astro-over-nextjs.md) · [ADR-005](../adr/005-bilingual-i18n-en-es.md) |
| D-03 | 2026-06-15 | Tracking = **markdown control-tower** (sin GitHub Project por ahora; revisitar si el backlog crece) | — |
| D-04 | 2026-06-16 | Branding **cloud-general** (no AWS-específico) en todo el copy | [ADR-003](../adr/003-cloud-general-branding.md) |
| D-05 | 2026-06-16 | DNS: mantener la zona en **Route53** (cuenta PROD trading) y apuntar a Vercel con un `A`; **no** delegar NS ni meterlo en el CDK del trading | [ADR-004](../adr/004-dns-route53-zone-vercel-a-record.md) |
| D-06 | 2026-06-16 | Repo `mizolutions/site` **privado**, separado del trading-system | — |
