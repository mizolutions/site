# 🚀 Prompt de arranque — próxima sesión (`mizolutions.com`)

> **Qué es esto.** Prompt autocontenido para iniciar la siguiente sesión sobre el
> **sitio landing** (NO el trading-system). Pega el bloque al abrir, o pide "lee
> `docs/control/NEXT_SESSION_PROMPT.md`". **Mantenimiento:** refrescar al cierre de
> cada sesión. Fuente de verdad: [CONTROL_TOWER.md](CONTROL_TOWER.md) +
> [RAID.md](RAID.md) + [ROADMAP.md](ROADMAP.md).
>
> **▶️ ESTADO (cierre 2026-06-25):** el sitio está **LIVE en `https://mizolutions.com`**
> (Astro 5 estático en Vercel, bilingüe EN/ES, DNS Route53→Vercel + SSL). Repo
> `mizolutions/site` **público**, `main` = `f411328`, árbol limpio, build verde (13 páginas + 3 feeds RSS), `astro check` 0/0/0.
> **Sesión 2026-06-25:** (1) **cron de publicación ACTIVADO + probado** (Deploy Hook + secret `VERCEL_DEPLOY_HOOK`;
> `workflow_dispatch` → success, hook HTTP 201) → **Fase 0 100% operativa**, rebuild semanal lunes 13:00 UTC.
> (2) **S-20 email — recepción FUNCIONAL** vía **ImprovMX** (descartado Zoho, sin free): MX+SPF en Route53 (INSYNC,
> TXT de Google preservado), `ping@`→Gmail validado → **CTA desbloqueado**. Pendiente OPCIONAL: "responder como ping@".
> (3) **S-04 OG image**: tarjeta de marca 1200×630 (`sharp` desde SVG, `scripts/build-og.mjs`) cableada site-wide
> (`og:image`+`twitter:image`+`summary_large_image`). (4) **Buttondown APROBADO** → Fase 1 newsletter desbloqueada;
> `/newsletter.xml` verificado live+válido (HTTP 200), form OK.
>
> **▶️ FOCO PRÓXIMA SESIÓN:** (a) **▶️ Fase 1 newsletter — CONFIGURAR** (Buttondown ya aprobado): operador activa
> add-on **RSS-to-email** (+$9/mo) → feed `https://mizolutions.com/newsletter.xml`, cadencia **Weekly·Monday ≥15:00
> UTC** (tras el rebuild 13:00), **⚠️ SKIP OLD ITEMS** (si no, manda A0+E1 a todos), behavior draft-first→auto-send;
> **2 decisiones pendientes** (el operador canceló las preguntas): (a) custom-domain sending → yo cableo DKIM/SPF en
> Route53 (fusionar SPF con ImprovMX si aplica) vs default Buttondown; (b) draft-first vs auto-send. (b) **Fase 2
> social** crear LinkedIn Page + X `@mizolutions` + scheduler; (c) **Search Console** indexación; (d) deuda menor
> (S-05 analytics, S-06 ES 404, S-09 www→apex, S-08 Hobby→Pro). Publicar siguiente post = `draft:false` + `pubDate`
> de lunes futuro.

---

Actúa como mi ingeniero frontend + copywriter técnico B2B + SRE del sitio
`mizolutions.com` (landing de la consultoría **Mizolutions**). **IA propone,
humano dispone**: cambios de copy/diseño y cualquier cosa que toque DNS/dominio
los preparas y me pides OK antes de aplicar a producción.

## 0. Contexto del proyecto (NO confundir con el trading-system)
- **Este repo:** `mizolutions/site` (**público**, build-in-public). Local:
  `/home/dc-user/workspace/mizolutions-site` (**sibling** del trading-system,
  **fuera** del workspace VS Code → usa terminal + rutas absolutas; `grep_search`/
  `file_search` NO lo ven).
- **Stack:** Astro 5 estático, TypeScript, CSS tokens a mano, dark-mode, i18n
  EN(`/`)+ES(`/es`). Todo el copy en `src/i18n/ui.ts`. Cero JS por defecto.
- **Hosting:** Vercel (push a `main` → deploy de producción). Plan **Hobby**
  (ojo: uso comercial pide **Pro** — decisión S-08).
- **Dominio:** `https://mizolutions.com` LIVE. `A 216.198.79.1` en la zona
  Route53 `Z062327723TCUEVA9TY8M` (cuenta PROD trading `520999258244`, zona
  **separada** de `miz0.com`; NO delegar NS a Vercel, NO meter en el CDK del
  trading). `miz0.com` = dominio técnico del backend, **no se toca desde aquí**.
- **Auth git:** `gh auth setup-git` ya configurado (usuario `mizo-tenich`, el
  dueño). Un `git push` directo sin eso usa `misael-castro` → 403.

## 1. Posicionamiento (regla de marca, innegociable)
- El sitio vende **consultoría SRE/Cloud/IaC**. **Trinitrade = caso de estudio de
  confiabilidad, NUNCA producto financiero, sin claims de P&L/retorno** (ADR-002).
- Branding **cloud-general** (no AWS-específico; ADR-003). Tono directo, técnico,
  sin humo. Audiencia: CTOs, Tech Leads, Founders.

## 2. Estado al cerrar (verificar con `git status -sb`)
- `main` = `f411328`, en sync, build verde (13 páginas + 3 feeds RSS), `astro check` 0/0/0.
- **0 incidencias bloqueantes.** Páginas: home, blog, **`/misael` (CV)**, **`/trinitrade` (caso de estudio)**, todas EN+ES.
- **SEO**: JSON-LD + Google Search Console verificado (TXT) + sitemap (procesando) + 3 feeds RSS + **OG image** (S-04 ✅, tarjeta de marca site-wide, `summary_large_image`).
- **Blog**: **2 posts LIVE** (A0 + **E1**) + **31 drafts** en cola; programa 33/33 completo. Publicar el siguiente = `draft:false` + `pubDate` de **lunes futuro** (lo revela el rebuild del lunes).
- **Automatización (Fase 0)**: gate `draft`+`pubDate` en `src/utils/posts.ts`; feeds `/rss.xml` `/es/rss.xml` `/newsletter.xml`; cron `weekly-publish.yml` **ACTIVO ✅** (secret `VERCEL_DEPLOY_HOOK` cargado, probado HTTP 201). Diseño en [BLOG_PLAN §8](BLOG_PLAN.md).
- **Email (S-20)**: **recepción FUNCIONAL ✅** — `ping@mizolutions.com` recibe vía **ImprovMX** (MX+SPF en Route53) → Gmail. Pendiente OPCIONAL: "responder como ping@".
- **Newsletter (S-03 / Fase 1)**: **Buttondown APROBADO ✅**; form OK; feed `/newsletter.xml` live+válido. **Falta configurar RSS-to-email** (ver §3).


## 3. ▶️ PENDIENTE PRINCIPAL — Fase 1 newsletter (Buttondown ya aprobado)
Repo **listo** (feed live+válido, form OK). Es **colaborativo**: el operador configura el dashboard de Buttondown;
el agente cablea DNS de entregabilidad si se elige custom-domain.
1. **Operador (Buttondown):** activar add-on **RSS-to-email** (+$9/mo) → nuevo feed
   `https://mizolutions.com/newsletter.xml`.
2. **Operador:** cadencia **Weekly · Monday**, hora **≥15:00 UTC** (después del rebuild del cron, 13:00 UTC, para
   que el post de la semana ya esté en el feed).
3. **Operador:** **⚠️ activar "Skip old items"** — si no, el primer poll envía A0+E1 (ya publicados) a todos.
4. **Operador (decisión a):** behavior **"Create a draft"** para el 1er envío (revisar maqueta bilingüe) → luego
   **"Send automatically"**. (O auto-send directo.)
5. **Decisión b — envío desde dominio (entregabilidad):** si se quiere `from @mizolutions.com`, el operador inicia
   "custom/sending domain" en Buttondown → pasa los DNS al **agente** → se aplican en Route53 (`Z062327723TCUEVA9TY8M`).
   ⚠️ Si Buttondown pide un **include SPF en el apex**, **fusionarlo** con el de ImprovMX en UN solo TXT
   (`v=spf1 include:spf.improvmx.com include:<buttondown> ~all`) — el dominio admite un solo SPF. Los DKIM suelen ser
   CNAMEs en subdominio (no chocan). Añadir DMARC `_dmarc` (`v=DMARC1; p=none; rua=mailto:ping@mizolutions.com`).
6. **Test:** suscribirse con un email + verificar que el digest del lunes llega bien (bilingüe EN arriba / ES abajo).

## 4. Otros pendientes (ver [ROADMAP](ROADMAP.md) → Now/Next)
- **S-21 / S-22 (humano):** crear LinkedIn page + X `@mizolutions`. Al existir,
  **descomentar las 2 líneas** ya listas en `src/consts.ts` (vuelven al footer).
- **S-11 (decisión):** account-id `520999258244` + zona `Z0623…` aparecen en docs
  públicos (R-07). Decidir: aceptar (normal en build-in-public) vs redactar a futuro.
- **S-08 (decisión):** Vercel Hobby→Pro (uso comercial) vs Cloudflare Pages.
- **S-04 (SEO):** OG image 1200×630 + `twitter:card=summary_large_image`.
- **S-05:** Vercel Web Analytics (sin cookies). **S-06:** página 404 en ES.
- **S-09:** `www` redirect al apex. **S-23:** pulir perfil del GitHub org.

## 5. Cómo trabajar el sitio
```bash
cd /home/dc-user/workspace/mizolutions-site
npm install            # primera vez
npm run dev            # http://localhost:4321
npm run build          # build de producción (7 páginas + sitemap)
npx astro check        # tipos/plantillas (debe dar 0/0/0)
```
- **Copy:** `src/i18n/ui.ts` (EN+ES, fuente única). **Marca/links:** `src/consts.ts`.
- **Acento/tipografía:** `src/styles/tokens.css`. **Blog:** `src/content/blog/*.md`
  (frontmatter `draft`/`lang`). Nuevo post = `.md` con `lang` correcto.

## 6. Disciplina de cierre (cada sesión)
- Anota el cambio en [../../CHANGELOG.md](../../CHANGELOG.md) (`[Unreleased]`).
- Decisión grande → ADR en [../adr/](../adr/) + fila en [RAID.md](RAID.md) §D.
- Worklog en [../worklog/](../worklog/). Refresca [CONTROL_TOWER.md](CONTROL_TOWER.md)
  (semáforo + Top-3 + bitácora) y este prompt.

## 7. Footguns
- ⛔ NO delegar los nameservers de `mizolutions.com` a Vercel (rompe el aislamiento;
  la zona se queda en Route53). Usar la pestaña **DNS Records** de Vercel, NO **Vercel DNS**.
- ⛔ NO meter el DNS del sitio en el CDK del trading-system ni en la zona `miz0.com`.
- ⛔ Antes de linkear una red social, **verificar que la cuenta existe** (X/LinkedIn
  NO existían al cierre; GitHub org SÍ). No publicar links muertos.
- ⛔ NO subir `.env` (gitignored). Las env vars de Vercel son opcionales.
- ⚠️ Vercel cambió la IP apex a `216.198.79.1` (la vieja `76.76.21.21` sigue pero
  deprecada) → usar lo que muestre la pestaña DNS Records.
- ⚠️ `npm audit` muestra highs en astro/esbuild/vite → **aceptados** (no aplican a
  build estático; README §audit). NO `audit fix --force` (trae Astro alpha).
  Dependabot está activo (repo público) y los flagea: esperado, no urgente.
- ⚠️ Repo público → `gh repo edit ... --visibility` requiere
  `--accept-visibility-change-consequences`.

**Primer paso al abrir:** `git status -sb`, lee [CONTROL_TOWER.md](CONTROL_TOWER.md)
§1+§2 + [BLOG_PLAN §8](BLOG_PLAN.md) §3 de este prompt. Prioridad del día: **(a)** **▶️ Fase 1 newsletter** —
guiar al operador a configurar Buttondown RSS-to-email (feed `/newsletter.xml`, Monday ≥15:00 UTC, **skip-old**,
draft→auto-send) + 2 decisiones (custom-domain sending → DNS en Route53 / draft-vs-autosend); **(b)** **Fase 2
social** (crear LinkedIn Page + X `@mizolutions` + scheduler); **(c)** Search Console (indexación); **(d)** deuda
menor (S-05 analytics, S-06 ES 404, S-09 www→apex). Ya hechos: cron (Fase 0), email entrante (S-20), OG image (S-04).
El sitio ya está LIVE; el trabajo es contenido + crecimiento + automatización, sin romper el minimalismo ni la marca.

> ⚠️ **Footgun de entorno:** la red corporativa del operador (Palo Alto/Mastercard) **sinkholea `mizolutions.com`**
> → cualquier fetch/curl/navegador desde aquí da **503** (página de bloqueo, NO fallo del sitio). Para verificar
> el sitio en vivo usa `gh api repos/mizolutions/site/commits/<sha>/status` (Vercel=success) o pide al operador
> que lo abra desde su red personal. Push: commit como `Mizolutions`/`ping@mizolutions.com` (gh auth ya configurado).
