# 🎛️ Control Tower — mizolutions.com

> **Propósito:** página única que responde en 30 segundos *"¿cómo está el sitio
> hoy y qué exige mi atención?"*
> **Owner:** tú (single operator). **Cadencia:** actualizar al inicio Y al cierre
> de cada sesión que toque el sitio.
>
> **Última actualización:** 2026-06-25 (**cron de publicación ACTIVADO + email entrante FUNCIONAL**). El sitio
> sigue **LIVE en `https://mizolutions.com`** (Astro 5 estático en Vercel, bilingüe EN/ES). Repo
> `mizolutions/site` (**público**), `main` = `d7dbd86`, build verde (13 páginas + 3 feeds RSS), `astro check` 0/0/0.
>
> **🟢 Sesión 2026-06-25 — automatización Fase 0 ACTIVADA (cron live) + email entrante (S-20).** (A) El operador
> creó el Deploy Hook en Vercel + cargó el secret `VERCEL_DEPLOY_HOOK`; disparé `weekly-publish.yml` vía
> `workflow_dispatch` → **success**, hook **HTTP 201** (rebuild de Vercel disparado). Rebuild semanal de los lunes
> (13:00 UTC) **operativo**. (B) **S-20 email — recepción FUNCIONAL ✅**: tras descartar Zoho (sin free), ruta
> **ImprovMX forwarding (gratis)**; cableé **MX + SPF** en Route53 (`Z0623…`, INSYNC, TXT de Google preservado);
> el operador añadió el alias `ping@`→Gmail y **validó la recepción**. **El CTA primario ya funciona.** Queda como
> pendiente OPCIONAL el "responder como ping@" (ImprovMX gratis solo recibe). Refrescado el prompt de sesión.
>
> **🟢 Sesión 2026-06-24 (tarde) — 1er post publicado + automatización de publicación (Fase 0).**
> (1) **Publicado E1** *"I tried to find a trading edge and failed 7 times"* (EN+ES, `draft:false`) — primer post
> de la cola de [BLOG_PLAN §5](BLOG_PLAN.md) tras A0. Build pasó de 11→13 páginas; Vercel `success`.
> (2) **Diseñada y arrancada la automatización semanal** (modelo POSSE "RSS como espina dorsal"): un evento —
> "el post sale vivo" — dispara sitio + email + social vía RSS. **Fase 0 (fundación) SHIPPED:**
> **(a)** gate de publicación centralizado en `src/utils/posts.ts` (en prod un post vive solo si `draft:false`
> **y** `pubDate <= build`; dev muestra todo para preview) aplicado en índice + slug EN/ES;
> **(b)** **3 feeds RSS** — `/rss.xml` (EN), `/es/rss.xml` (ES) + `/newsletter.xml` **bilingüe** (empareja EN+ES
> por `pubDate` → 1 email semanal con teaser EN arriba/ES abajo, para Buttondown RSS-to-email);
> **(c)** **GitHub Action `weekly-publish.yml`** — cron lunes 13:00 UTC → Vercel Deploy Hook (+ `workflow_dispatch`),
> **no-opea** hasta que exista el secret `VERCEL_DEPLOY_HOOK`;
> **(d)** campo frontmatter `socialEN` (hook para la Fase 2 social) + RSS discovery links en `<head>`.
> E1 re-fechado a 2026-06-23 para seguir vivo bajo el gate. `astro check` 0/0/0, 2 commits (`feef6da`, `7147db4`),
> Vercel `success`. **Decisiones de scope** (presupuesto ~$15-30/mo, email biling\u00fce en uno, social EN-only con
> aprobación, copy pre-escrito) en [BLOG_PLAN §8](BLOG_PLAN.md). **⚙️ PENDIENTE OPERADOR (activa el cron):** crear
> Deploy Hook en Vercel → cargar URL como secret `VERCEL_DEPLOY_HOOK` en GitHub. **Fase 1 (email)** bloqueada por
> aprobación de Buttondown; **Fase 2 (social)** bloqueada por crear LinkedIn Page + X.
>
> **🟢 Sesión 2026-06-24 — programa de blog completado (33/33 candidatos drafteados, EN+ES).**
> Sesión 100% producción de contenido. Se completaron los **6 clusters** de [BLOG_PLAN.md](BLOG_PLAN.md):
> **A** SRE/Obs (6) · **B** FinOps (4) · **C** IaC war-stories (6) · **D** Data (6) · **E** Research (7) ·
> **F** Lead-discipline (4) = **33 posts**, cada uno **EN+ES** (66 `.md`) con **4–5 diagramas** Mermaid→SVG
> (Kroki, `theme=dark`, commiteados en `public/blog/<en-slug>/` → **33 carpetas de assets**), 1 callout
> "Key insight", sección **References** (externos rigurosos + internos mizolutions/Trinitrade + interlinks
> entre hermanos), `astro check` 0/0/0 y `npm run build` limpio en cada uno. **TODOS `draft:true`** (invisibles
> en prod, visibles en `npm run dev`). `docs/control/BLOG_PLAN.md`: las 33 filas marcadas "draft+visuals ✅ …
> en review" (**0 filas en estado `idea`**). Framing honesto en todos (sin claims P&L/retorno, sin secretos,
> candor sobre fallos; F4 = capstone "build & conclude honestly"). ~16 commits esta sesión
> (`6b4b893`…→`c5cb727`), todos pusheados a `main`, Vercel `success` (drafts excluidos → cero cambio en la web
> pública). **Pendiente:** review del operador de los 33 drafts + empezar a **publicar 1/semana** (flip
> `draft:false` según orden de [BLOG_PLAN §5](BLOG_PLAN.md)).
> Hitos de hoy: **(1)** caso de estudio **`/trinitrade` (EN+ES)** enriquecido — TOC, **8 diagramas de
> arquitectura** (SVG dark vía Kroki), links al repo público por sección, home alineada al marco honesto;
> **(2)** nueva **página de CV `/misael` (EN+ES)** con Trinitrade como proyecto destacado, sección
> **Speaking** (3 conferencias 2024) y **botón Download PDF**; **(3)** **SEO**: JSON-LD
> (Person/Organization/WebSite/TechArticle) + **Google Search Console verificado** (registro TXT en
> Route53) + sitemap enviado (GSC procesando); **(4)** **newsletter (S-03)**: form arreglado
> (endpoint `buttondown.email`→`.com` + CSP), cuenta Buttondown creada pero **en revisión** por Buttondown.
> **0 incidencias bloqueantes.** Pendientes activos: S-20 email, S-04 OG image, S-05 analytics,
> S-03 (espera aprobación Buttondown), GSC (procesando, retomar mañana).
>
> **🟢 Sesión 2026-06-23 — Trinitrade portfolio + CV `/misael` + SEO/JSON-LD + Search Console.**
> Sesión 100% sitio (el proyecto trading-system quedó concluido y publicado como portfolio). **(1) `/trinitrade`
> enriquecido:** índice navegable, 8 diagramas Mermaid renderizados a **SVG estáticos** (Kroki, JSON API
> `theme=dark`, commiteados en `public/trinitrade/diagrams/` → el sitio no depende de nada externo en runtime),
> "On GitHub" deep-links por sección al repo público `mizolutions/trinitrade`, y la home alineada al marco
> honesto (fuera `< 30 bps`/`institutional-grade`, dentro `7/7 NO-GO`). **(2) Página de CV `/misael` + `/es/misael`:**
> diseño a juego (dark/esmeralda), header con contacto (email + LinkedIn + sitio; **teléfono omitido por
> privacidad**), **proyecto destacado Trinitrade**, summary, competencias, timeline de 6 roles, **Speaking**
> (EXPROY 2024, EXPOTEL 2024, UPTEX 2024), educación, idiomas, **botón Download PDF** (`public/MisaelTenorio_DevOps_SRE.pdf`).
> Arreglado el 404 de `/es/misael` (faltaba la página ES). **(3) SEO:** soporte `jsonLd` en `Base`/`BaseHead`;
> `Person` en /misael, `ProfessionalService`+`WebSite` en la home, `TechArticle` en /trinitrade. **(4) Google
> Search Console:** dominio **verificado** vía TXT `google-site-verification=...` añadido a la zona Route53
> `Z062327723TCUEVA9TY8M` (cuenta PROD, vía `dc-aws` change-batch base64); sitemap `sitemap-index.xml` enviado
> (GSC procesando — el 503 al fetch desde la red corporativa es el sinkhole de Palo Alto, no el sitio; deploy
> Vercel `6df0735` = success). **(5) Newsletter S-03:** endpoint Buttondown legacy `.email` (302-redirect que
> tira el POST) → `.com` + CSP `form-action` actualizada; cuenta `mizolutions` creada pero **en revisión** por
> Buttondown (el form devuelve su página de error de cuenta-no-aprobada, no un fallo del sitio). Expectativa SEO
> honesta fijada: rankeable marca/long-tail (misael tenorio, mizolutions, trinitrade), NO términos head genéricos.
> ~13 commits (`255eac5`→`87f4b72`). **(6) Blog:** arrancado el programa de contenido — [BLOG_PLAN.md](BLOG_PLAN.md)
> con **33 candidatos** deep-dive bilingües minados de Trinitrade (6 clusters, cadencia semanal, mecánica
> `draft:true`) + **E1 drafteado** ("no trading edge in 7 strategies", EN+ES, pendiente review del operador).
>
> **🟢 Sesión 2026-06-16 (cierre) — repo público + 1er post + identidades.** Tras
> el bootstrap (abajo): (1) repo flipeado a **público** (build-in-public) +
> backlog completo poblado (S-01..S-23) en RAID + ROADMAP. (2) **S-07** higiene del
> repo: description + 13 topics + homepage→`mizolutions.com` (era el preview de
> Vercel). (3) **S-01** publicado el 1er post del blog _logs→observabilidad_ (EN+ES,
> 7 páginas). (4) **S-02** footer honesto: verificado que `github.com/mizolutions`
> **sí existe** (org del repo) → footer = GitHub+email; X/LinkedIn **no existen aún**,
> comentados en `consts.ts` (cero links muertos). (5) Email: dirección elegida
> **`ping@mizolutions.com`** (sitio ya apunta ahí, EN/ES); proveedor = **Zoho Mail
> Free** (S-20 en curso, **bloquea el CTA primario** — falta signup del operador +
> cablear MX/SPF/DKIM en Route53). Tareas de identidad creadas: S-20 email, S-21
> LinkedIn, S-22 X, S-23 perfil del GitHub org. 5 commits: `4ab1a30`→`f1cec08`.
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
| 1 | **Site / Deploy** | 🟢 | build verde · deploy Ready | Vercel **Ready**, `main`=`7147db4`, Astro 5 estático, `npm run build` verde (13 páginas + 3 feeds RSS + sitemap), `astro check` 0/0/0 | tú |
| 2 | **Content / Blog** | 🟢 | posts live · cola · automatización | **2 posts LIVE** (A0 + **E1 publicado hoy**) + **31 drafts** en cola. **NUEVO 2026-06-24 (tarde):** automatización de publicación **Fase 0** — gate por fecha+draft, **3 feeds RSS** (`/rss.xml`, `/es/rss.xml`, `/newsletter.xml` bilingüe), cron lunes → Vercel Deploy Hook (**ACTIVO** ✅, probado 2026-06-25 HTTP 201). Mecánica de publicar: `draft:false` + `pubDate` de lunes futuro. Ver [BLOG_PLAN §8](BLOG_PLAN.md). **email recibe ✅** (S-20, ImprovMX → Gmail). 404 solo EN (S-06) | tú |
| 3 | **Infra / DNS / SSL** | 🟢 | dominio Valid · SSL · email · zona aislada | `mizolutions.com` **Valid**, `A→216.198.79.1` (Route53 `Z062327723TCUEVA9TY8M`), SSL auto. TXT `google-site-verification` (Search Console). **NUEVO 2026-06-25:** **email entrante ✅** — MX ImprovMX (`mx1`/`mx2`) + SPF, `ping@`→Gmail (S-20). `www` pendiente (S-09); Hobby→Pro a decidir (S-08) | tú |
| 4 | **SEO / Analytics / Growth** | 🟡 | sitemap · meta · structured data · analytics | SEO base OK (canonical+hreflang+OG+sitemap+robots). **NUEVO 2026-06-23:** **JSON-LD** (Person/Organization/WebSite/TechArticle) + **Google Search Console verificado** + sitemap enviado (**procesando**, retomar mañana). **Pendiente:** **OG image ✅** (S-04, tarjeta de marca 1200×630), Analytics OFF (S-05), **newsletter (S-03) cuenta Buttondown en revisión** | tú |
| 5 | **Security / Deps** | 🟢 | headers · npm audit | CSP+HSTS+headers vía `vercel.json`. `npm audit`: 3 highs **aceptados** (no aplican a build estático). **Repo público** → account-id/zone-id en docs (R-07, decisión S-11) | tú |
| 6 | **Governance / Repo** | 🟢 | description · topics · backlog | ✅ description + 13 topics + homepage→`mizolutions.com` (S-07 hecho). LICENSE a decidir (S-13). Backlog 23 tareas trackeadas (3 hechas) | tú |

> **Regla del semáforo:** 🔴 = el sitio está caído o roto para visitantes; 🟡 =
> deuda conocida con plan; 🟢 = ningún pendiente bloqueante; ⚪ = sin medir.

---

## 2. Top-3 que exige tu atención

> Ordenado por impacto × oportunidad. Backlog completo (S-01..S-23) en
> [RAID §I](RAID.md) + [ROADMAP](ROADMAP.md).

1. **Fase 1 newsletter + Fase 2 social (bloqueadas por terceros)** — newsletter RSS-to-email espera **aprobación
   de Buttondown** (al aprobar → apuntar a `/newsletter.xml`, semanal lunes); social espera **crear las cuentas**
   `@mizolutions` (LinkedIn Page + X) + elegir scheduler. Dominio: Growth.
2. **Search Console (indexación)** — solicitar indexación de `/`, `/misael`, `/trinitrade` en GSC (confirmar
   sitemap "Correcto"). Dominio: SEO.
3. **Deuda menor:** Analytics OFF (S-05), 404 solo EN (S-06), `www`→apex (S-09), Vercel Hobby→Pro a decidir (S-08).
   Dominio: Infra/SEO.

> ✅ **Hecho 2026-06-25:** **(1)** **cron de publicación ACTIVO y probado** — Deploy Hook + secret
> `VERCEL_DEPLOY_HOOK`, `workflow_dispatch` **success**, hook **HTTP 201**; rebuild semanal (lunes 13:00 UTC)
> operativo, Fase 0 100%. **(2)** **S-20 email — recepción FUNCIONAL ✅**: `ping@mizolutions.com` recibe vía
> **ImprovMX** (MX+SPF en Route53, INSYNC, TXT de Google preservado) → reenvía a Gmail, **validado por el operador**.
> **El CTA primario ya funciona.** **(3)** **OG image (S-04)** — tarjeta de marca 1200×630 branded (dark + esmeralda,
> "DevOps & SRE") generada con `sharp` desde SVG (`scripts/build-og.mjs`), cableada **site-wide** (`og:image` +
> `twitter:image` + `summary_large_image`) → todos los links compartidos ya muestran tarjeta.
>
> ⏳ **Pendiente OPCIONAL (sin prisa) — "responder como ping@":** ImprovMX gratis es **solo recibir**. Para
> **responder mostrando** `ping@mizolutions.com` se configura aparte (SMTP de ImprovMX de pago, o "Send mail as"
> en Gmail). **No es necesario para el CTA**; se hace cuando el operador quiera.

---

## 3. Estado técnico de referencia

| Hecho | Valor |
|---|---|
| Repo | `mizolutions/site` (**público**, build-in-public), `main` = `3b022f7` |
| Local | `/home/dc-user/workspace/mizolutions-site` (sibling del trading-system, **fuera** del workspace VS Code) |
| Stack | Astro 5 estático, TypeScript, CSS tokens a mano, i18n EN/ES |
| Hosting | Vercel (plan **Hobby** — ⚠️ uso comercial pide **Pro** por ToS) |
| Dominio | `mizolutions.com` → `A 216.198.79.1` (Vercel), zona Route53 `Z062327723TCUEVA9TY8M` en cuenta PROD trading `520999258244` |
| Dominio técnico | `miz0.com` = backend/dashboards (Route53/CDK del trading-system) — **NO se toca desde aquí** |
| Páginas | home, blog (**2 posts live: A0 + E1** + 31 drafts EN+ES), **`/misael` (CV)**, **`/trinitrade` (caso de estudio)** — todas EN+ES (13 páginas en build prod; los drafts/futuros NO entran) |
| Feeds / automatización | `/rss.xml` (EN), `/es/rss.xml` (ES), `/newsletter.xml` (bilingüe, para Buttondown). Gate por `draft`+`pubDate` en `src/utils/posts.ts`. Cron lunes en `.github/workflows/weekly-publish.yml` (**ACTIVO** ✅ — secret `VERCEL_DEPLOY_HOOK` cargado, probado HTTP 201). Diseño en [BLOG_PLAN §8](BLOG_PLAN.md) |
| SEO | robots + sitemap + canonical + hreflang + OG + **JSON-LD** (Person/Org/WebSite/TechArticle); Google Search Console verificado (TXT) |
| Build | `npm run build` (+ sitemap), `npm run dev` (preview), `npx astro check` (tipos) |
| Deploy | push a `main` → deploy de producción automático en Vercel |

---

## 4. Bitácora de sesiones (resumen)

| Fecha | Resumen | `main` |
|---|---|---|
| 2026-06-23 | **Portfolio Trinitrade** (`/trinitrade` TOC + 8 diagramas SVG + repo links) + **CV `/misael` EN+ES** (Speaking + Download PDF) + **SEO JSON-LD** + **Search Console verificado** + newsletter endpoint fix (S-03 en revisión) + **plan de blog (BLOG_PLAN, 33 candidatos)** + **draft E1** | `87f4b72` |
| 2026-06-16 | Bootstrap: landing Astro 5 live + DNS Route53→Vercel + torre de control | `931bd55` |
| 2026-06-16 | Repo → público; backlog completo (S-01..S-19) poblado en RAID + ROADMAP | `fe6925e` |
| 2026-06-16 | S-07 higiene repo (description/topics/homepage) + S-01 1er post publicado (EN+ES) | `c8e28c6`+ |
| 2026-06-16 | S-02 footer honesto (GitHub+email; X/LinkedIn no existen aún) + tareas de identidad S-20..S-23 | `b7c9986`+ |
| 2026-06-16 | Email del sitio → `ping@mizolutions.com` (Zoho Free planeado, S-20 en curso) · **cierre de sesión** | `f1cec08` |

> Detalle por sesión en [../worklog/](../worklog/). Decisiones en [../adr/index.md](../adr/index.md).
