# 🚀 Prompt de arranque — próxima sesión (`mizolutions.com`)

> **Qué es esto.** Prompt autocontenido para iniciar la siguiente sesión sobre el
> **sitio landing** (NO el trading-system). Pega el bloque al abrir, o pide "lee
> `docs/control/NEXT_SESSION_PROMPT.md`". **Mantenimiento:** refrescar al cierre de
> cada sesión. Fuente de verdad: [CONTROL_TOWER.md](CONTROL_TOWER.md) +
> [RAID.md](RAID.md) + [ROADMAP.md](ROADMAP.md).
>
> **▶️ ESTADO (apertura 2026-06-25):** el sitio está **LIVE en `https://mizolutions.com`**
> (Astro 5 estático en Vercel, bilingüe EN/ES, DNS Route53→Vercel + SSL). Repo
> `mizolutions/site` **público**, `main` = `4bc4d29`, árbol limpio, build verde (13 páginas + 3 feeds RSS), `astro check` 0/0/0.
> **Sesión 2026-06-24:** (1) **programa de blog COMPLETO** — 33/33 candidatos drafteados (EN+ES, 6 clusters,
> 4–5 diagramas + callout + refs cada uno, todos `draft:true`). (2) **Publicado E1** *"I tried to find a trading
> edge and failed 7 times"* (EN+ES) — 1er post de la cola tras A0 → **2 posts LIVE**. (3) **Automatización de
> publicación Fase 0** (modelo POSSE "RSS como espina dorsal"): gate por `draft`+`pubDate` (`src/utils/posts.ts`),
> **3 feeds RSS** (`/rss.xml` EN, `/es/rss.xml` ES, `/newsletter.xml` bilingüe para Buttondown), **GitHub Action
> cron lunes → Vercel Deploy Hook** (`weekly-publish.yml`, no-opea hasta cargar secret), campo `socialEN`. Diseño
> y decisiones de scope en [BLOG_PLAN §8](BLOG_PLAN.md).
>
> **▶️ FOCO PRÓXIMA SESIÓN:** (a) **⚙️ ACTIVAR EL CRON** — crear Deploy Hook en Vercel (Settings → Git → Deploy
> Hooks, branch `main`) + cargar URL como secret **`VERCEL_DEPLOY_HOOK`** en GitHub; probar con Actions → "Weekly
> publish" → Run workflow; (b) **S-20 email** (bloquea CTA *y* Fase 1 newsletter) — Zoho signup + MX/SPF/DKIM en
> Route53; (c) **Fase 1 newsletter** cuando Buttondown apruebe (RSS-to-email → `/newsletter.xml`); (d) **Fase 2
> social** crear LinkedIn Page + X; (e) Search Console (indexación) + S-04 OG image. Publicar el siguiente post =
> `draft:false` + `pubDate` de lunes futuro.

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
- `main` = `4bc4d29`, en sync, build verde (13 páginas + 3 feeds RSS), `astro check` 0/0/0.
- **0 incidencias bloqueantes.** Páginas: home, blog, **`/misael` (CV)**, **`/trinitrade` (caso de estudio)**, todas EN+ES.
- **SEO**: JSON-LD (Person/Org/WebSite/TechArticle) + Google Search Console verificado (TXT) + sitemap enviado (procesando) + 3 feeds RSS.
- **Blog**: **2 posts LIVE** (A0 logs→observabilidad + **E1 publicado**) + **31 drafts** en cola (`draft:true`); programa 33/33 completo. Publicar el siguiente = `draft:false` + `pubDate` de **lunes futuro** (lo revela el rebuild del lunes).
- **Automatización (Fase 0)**: gate `draft`+`pubDate` en `src/utils/posts.ts`; feeds `/rss.xml` `/es/rss.xml` `/newsletter.xml`; cron `weekly-publish.yml` (necesita secret `VERCEL_DEPLOY_HOOK`). Diseño en [BLOG_PLAN §8](BLOG_PLAN.md).
- **Newsletter (S-03 / Fase 1)**: form correcto (endpoint `buttondown.com`); cuenta Buttondown **en revisión**; al aprobar → RSS-to-email apuntando a `/newsletter.xml`.


## 3. ⚠️ PENDIENTE PRINCIPAL — S-20: email `ping@mizolutions.com` (bloquea el CTA)
El CTA primario "Book a reliability review" abre `mailto:ping@mizolutions.com`,
pero **hoy ese correo rebota** (0 MX en la zona). Plan elegido = **Zoho Mail Free**.
Es **colaborativo** (el operador hace el signup; el agente cablea el DNS):
1. **Operador:** signup en https://www.zoho.com/mail/ → "Forever Free Plan" →
   "Sign up with a domain I already own" → `mizolutions.com`.
2. **Operador:** método de verificación **TXT** → copia el valor
   `zoho-verification=zb…zmverify.zoho.com` y **pásamelo**.
3. **Agente:** aplica ese TXT en Route53 (`Z062327723TCUEVA9TY8M`) → operador pulsa
   "Verify".
4. **Operador:** crea el buzón **`ping@mizolutions.com`**; en *DKIM* genera el
   **selector + clave** y me los pasa.
5. **Agente:** aplica en Route53, **con los valores EXACTOS que muestre Zoho**
   (varían por región): MX (`mx.zoho.com`/`mx2`/`mx3`), SPF `v=spf1 include:zoho.com ~all`,
   DKIM (`<selector>._domainkey`), DMARC (`_dmarc` → `v=DMARC1; p=none; rua=mailto:ping@mizolutions.com`).
6. **Test:** enviar a `ping@` y confirmar recepción.

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
§1+§2 + [BLOG_PLAN §8](BLOG_PLAN.md). Prioridad del día: **(a)** **⚙️ activar el cron** (Deploy Hook en Vercel →
secret `VERCEL_DEPLOY_HOOK` en GitHub → probar Run workflow); **(b)** **S-20 email** (bloquea CTA + Fase 1); **(c)**
Fase 1 newsletter (esperar Buttondown) / Fase 2 social (crear LinkedIn + X); **(d)** Search Console + S-04 OG image.
El sitio ya está LIVE; el trabajo es contenido + crecimiento + automatización, sin romper el minimalismo ni la marca.

> ⚠️ **Footgun de entorno:** la red corporativa del operador (Palo Alto/Mastercard) **sinkholea `mizolutions.com`**
> → cualquier fetch/curl/navegador desde aquí da **503** (página de bloqueo, NO fallo del sitio). Para verificar
> el sitio en vivo usa `gh api repos/mizolutions/site/commits/<sha>/status` (Vercel=success) o pide al operador
> que lo abra desde su red personal. Push: commit como `Mizolutions`/`ping@mizolutions.com` (gh auth ya configurado).
