# 📋 RAID Log — mizolutions.com

> **R**isks · **A**ssumptions · **I**ssues · **D**ecisions
> Tabla viva. Actualizar en cada cierre de sesión si hubo cambios.
> Si un ítem lleva > 30 días sin movimiento, re-evaluar o cerrar.
> **Última actualización:** 2026-06-16 (repo flipeado a **público** [build-in-public] + backlog completo poblado, S-01..S-19)

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
| R-07 | **Repo público** → los docs de control exponen el account-id AWS `520999258244`, la zona `Z062327723TCUEVA9TY8M` y change-ids. También la saga de decisiones internas (estrategias NO-GO, etc.) | Seguridad/Marca | Cierta | Bajo | Account-ids y zone-ids **no son secretos** (aparecen en ARNs); ya están en el historial git (redactar no los borra del pasado). Decisión consciente en **S-11** (aceptar vs redactar a futuro). NUNCA subir secretos reales (`.env` gitignored) | activo (decisión S-11) |

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

> **Backlog del sitio (S-NN).** Estado: ⬜ no empezada · 🔄 en curso · ✅ hecha.
> Prioridad: P2 (pronto) · P3 (cuando toque) · P4 (nice-to-have) · L (later/estratégico).

| ID | Título corto | Dominio | Prio | Estado | Notas |
|---|---|---|---|---|---|
| S-01 | Publicar 1er post del blog (flip `draft:false`) | Content | P2 | ⬜ | Borrador EN+ES listo (`logs-to-observability`/`de-logs-a-observabilidad`); revisar y publicar |
| S-02 | Socials + email reales en `src/consts.ts` | Content | P2 | ⬜ | Hoy placeholders (`hello@mizolutions.com`, github/linkedin/x). **Verificar que los handles existan** antes de linkear |
| S-03 | Conectar newsletter Buttondown + probar form | Growth | P3 | ⬜ | `PUBLIC_BUTTONDOWN_USERNAME` real (env Vercel o `consts.ts`); enviar un test de alta |
| S-04 | OG image 1200×630 + `twitter:card=summary_large_image` | SEO | P3 | ⬜ | Hoy sin `og:image`/`twitter:image`; añadir asset en `public/` + meta en `BaseHead.astro` |
| S-05 | Vercel Web Analytics (sin cookies) | Analytics | P3 | ⬜ | No cableado; sin cookies → sin banner. Mide tráfico por locale (valida A-01) |
| S-06 | Página 404 en ES | Content/i18n | P3 | ⬜ | Solo existe `/404` (EN); un visitante ES ve el 404 en inglés |
| S-07 | Higiene del repo público: description + topics + README "Private"→público | Gov | P3 | ⬜ | Repo sin description ni topics; README dice "Private" (stale tras flip público) |
| S-08 | Decidir Vercel Hobby → **Pro** (uso comercial, ToS) | Infra | P2 | ⬜ | Hobby es no-comercial (R-02). Alternativa: Cloudflare Pages (gratis, comercial OK) |
| S-09 | `www.mizolutions.com` → redirect al apex | Infra/DNS | P3 | ⬜ | Hoy solo el apex está configurado; añadir dominio en Vercel + `CNAME www` en Route53 |
| S-10 | Decidir `blog.mizolutions.com` (redirect vs proyecto propio) | Infra/Content | P3 | ⬜ | Hoy el blog vive en `/blog`; subdominio opcional (ADR futuro) |
| S-11 | **Decisión:** aceptar vs redactar account-id/zone-id en docs públicos | Seguridad/Gov | P2 | ⬜ | Ver R-07. Account-ids no son secretos; decidir conscientemente. Redactar-a-futuro no borra el historial git |
| S-12 | CTA "Book a reliability review" → Cal.com (o mantener `mailto:`) | Growth | P3 | ⬜ | Hoy el CTA primario abre `mailto:`; un enlace de agenda reduce fricción |
| S-13 | Decidir LICENSE del repo público (all-rights-reserved vs explícito) | Gov | P3 | ⬜ | Sin LICENSE = "todos los derechos reservados" (válido para un sitio de marca). Decidir y documentar |
| S-14 | `apple-touch-icon` / PNG favicon fallback | SEO | P4 | ⬜ | Hoy solo `favicon.svg`; iOS/legacy no lo usan |
| S-15 | Cadencia de blog (2º/3er post) | Content | L | ⬜ | Motor del build-in-public; ideas: post-mortems, arquitectura, observabilidad |
| S-16 | CI mínimo (astro check + build en PR) | Gov/Infra | P4 | ⬜ | Vercel ya hace preview builds; un workflow GH da gate explícito en PRs |
| S-17 | `app.mizolutions.com` (SaaS de señales) = proyecto **separado** | Producto | L | ⬜ | Si nace el SaaS, va aparte (Next.js); NO acoplar a la landing (ADR-001) |
| S-18 | Página de servicios / contacto (form o Cal.com) | Growth | L | ⬜ | Hoy la conversión es solo el CTA `mailto:`; una página de servicios ayudaría al SEO/venta |
| S-19 | Montar GitHub Project si el backlog supera ~10 vivos | Gov | L | ⬜ | Hoy markdown basta (D-03); revisitar al crecer |

---

## D — Decisions (decisiones tomadas, con fecha)

| ID | Fecha | Decisión | ADR |
|---|---|---|---|
| D-01 | 2026-06-15 | Posicionamiento = **consultoría SRE/Cloud**; Trinitrade = caso de estudio sin P&L | [ADR-002](../adr/002-consultancy-positioning-trinitrade-case-study.md) |
| D-02 | 2026-06-15 | Stack = **Astro estático** (no Next.js) en Vercel; bilingüe EN/ES | [ADR-001](../adr/001-static-astro-over-nextjs.md) · [ADR-005](../adr/005-bilingual-i18n-en-es.md) |
| D-03 | 2026-06-15 | Tracking = **markdown control-tower** (sin GitHub Project por ahora; revisitar si el backlog crece) | — |
| D-04 | 2026-06-16 | Branding **cloud-general** (no AWS-específico) en todo el copy | [ADR-003](../adr/003-cloud-general-branding.md) |
| D-05 | 2026-06-16 | DNS: mantener la zona en **Route53** (cuenta PROD trading) y apuntar a Vercel con un `A`; **no** delegar NS ni meterlo en el CDK del trading | [ADR-004](../adr/004-dns-route53-zone-vercel-a-record.md) |
| D-06 | 2026-06-16 | Repo `mizolutions/site` **público** (build-in-public), separado del trading-system. *(Creado privado; flipeado a público a petición del operador el 2026-06-16.)* | — |
| D-07 | 2026-06-16 | Tracking del backlog completo (S-01..S-19) en RAID + ROADMAP; pendiente la decisión consciente de redacción de account-ids (S-11) | — |
