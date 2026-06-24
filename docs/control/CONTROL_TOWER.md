# 🎛️ Control Tower — mizolutions.com

> **Propósito:** página única que responde en 30 segundos *"¿cómo está el sitio
> hoy y qué exige mi atención?"*
> **Owner:** tú (single operator). **Cadencia:** actualizar al inicio Y al cierre
> de cada sesión que toque el sitio.
>
> **Última actualización:** 2026-06-23 (**sesión larga — portfolio Trinitrade + CV + SEO**). El sitio
> sigue **LIVE en `https://mizolutions.com`** (Astro 5 estático en Vercel, bilingüe EN/ES). Repo
> `mizolutions/site` (**público**), `main` = `87f4b72`, build verde (~11 páginas), `astro check` 0/0/0.
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
| 1 | **Site / Deploy** | 🟢 | build verde · deploy Ready | Vercel **Ready**, `main`=`87f4b72`, Astro 5 estático, `npm run build` verde (~11 páginas + sitemap), `astro check` 0/0/0 | tú |
| 2 | **Content / Blog** | 🟢 | # páginas · copy fresco | Landing EN+ES + 1 post (S-01). **NUEVO 2026-06-23:** caso de estudio **`/trinitrade` (EN+ES)** enriquecido (TOC + 8 diagramas SVG + repo deep-links) + **CV `/misael` (EN+ES)** (proyecto destacado, Speaking, Download PDF). **Plan editorial: 33 candidatos de blog** en [BLOG_PLAN.md](BLOG_PLAN.md) (deep-dive bilingüe, cadencia semanal). Footer honesto (S-02 ✅). **email aún no funciona** (S-20). 404 solo EN (S-06) | tú |
| 3 | **Infra / DNS / SSL** | 🟢 | dominio Valid · SSL · zona aislada | `mizolutions.com` **Valid**, `A→216.198.79.1` (Route53 `Z062327723TCUEVA9TY8M`), SSL auto. **NUEVO:** TXT `google-site-verification` añadido para Search Console. `www` pendiente (S-09); Hobby→Pro a decidir (S-08) | tú |
| 4 | **SEO / Analytics / Growth** | 🟡 | sitemap · meta · structured data · analytics | SEO base OK (canonical+hreflang+OG+sitemap+robots). **NUEVO 2026-06-23:** **JSON-LD** (Person/Organization/WebSite/TechArticle) + **Google Search Console verificado** + sitemap enviado (**procesando**, retomar mañana). **Pendiente:** OG image (S-04), Analytics OFF (S-05), **newsletter (S-03) cuenta Buttondown en revisión** | tú |
| 5 | **Security / Deps** | 🟢 | headers · npm audit | CSP+HSTS+headers vía `vercel.json`. `npm audit`: 3 highs **aceptados** (no aplican a build estático). **Repo público** → account-id/zone-id en docs (R-07, decisión S-11) | tú |
| 6 | **Governance / Repo** | 🟢 | description · topics · backlog | ✅ description + 13 topics + homepage→`mizolutions.com` (S-07 hecho). LICENSE a decidir (S-13). Backlog 23 tareas trackeadas (3 hechas) | tú |

> **Regla del semáforo:** 🔴 = el sitio está caído o roto para visitantes; 🟡 =
> deuda conocida con plan; 🟢 = ningún pendiente bloqueante; ⚪ = sin medir.

---

## 2. Top-3 que exige tu atención

> Ordenado por impacto × oportunidad. Backlog completo (S-01..S-23) en
> [RAID §I](RAID.md) + [ROADMAP](ROADMAP.md).

1. **▶️ Search Console (retomar mañana)** — el dominio está **verificado** y el sitemap `sitemap-index.xml`
   **enviado**; GSC lo está **procesando** (estado "no válido/procesando" es normal en propiedad nueva, se
   resuelve solo). Mañana: confirmar sitemap en "Correcto" + **Inspección de URL** → Solicitar indexación de
   `/`, `/misael`, `/trinitrade`. Dominio: SEO.
2. **⚠️ Email `ping@mizolutions.com` funcional (S-20)** — **bloquea el CTA primario** (el `mailto:` rebota:
   0 MX en la zona). Cablear forwarding (MX+TXT) en Route53 tras elegir proveedor (Zoho Free planeado). Dominio: Infra/Growth.
3. **Newsletter (S-03) — esperar aprobación de Buttondown** + **OG image (S-04)** + **identidades sociales
   (S-21 LinkedIn / S-22 X)**: la cuenta Buttondown `mizolutions` está **en revisión** (el form ya está correcto);
   falta la imagen OG para previews al compartir; reservar handles sociales (signup humano). Dominio: Growth.

---

## 3. Estado técnico de referencia

| Hecho | Valor |
|---|---|
| Repo | `mizolutions/site` (**público**, build-in-public), `main` = `87f4b72` |
| Local | `/home/dc-user/workspace/mizolutions-site` (sibling del trading-system, **fuera** del workspace VS Code) |
| Stack | Astro 5 estático, TypeScript, CSS tokens a mano, i18n EN/ES |
| Hosting | Vercel (plan **Hobby** — ⚠️ uso comercial pide **Pro** por ToS) |
| Dominio | `mizolutions.com` → `A 216.198.79.1` (Vercel), zona Route53 `Z062327723TCUEVA9TY8M` en cuenta PROD trading `520999258244` |
| Dominio técnico | `miz0.com` = backend/dashboards (Route53/CDK del trading-system) — **NO se toca desde aquí** |
| Páginas | home, blog (+1 post), **`/misael` (CV)**, **`/trinitrade` (caso de estudio)** — todas EN+ES (~11 rutas en el sitemap) |
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
