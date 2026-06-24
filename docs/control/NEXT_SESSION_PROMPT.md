# 🚀 Prompt de arranque — próxima sesión (`mizolutions.com`)

> **Qué es esto.** Prompt autocontenido para iniciar la siguiente sesión sobre el
> **sitio landing** (NO el trading-system). Pega el bloque al abrir, o pide "lee
> `docs/control/NEXT_SESSION_PROMPT.md`". **Mantenimiento:** refrescar al cierre de
> cada sesión. Fuente de verdad: [CONTROL_TOWER.md](CONTROL_TOWER.md) +
> [RAID.md](RAID.md) + [ROADMAP.md](ROADMAP.md).
>
> **▶️ ESTADO (cierre 2026-06-24):** el sitio está **LIVE en `https://mizolutions.com`**
> (Astro 5 estático en Vercel, bilingüe EN/ES, DNS Route53→Vercel + SSL). Repo
> `mizolutions/site` **público**, `main` = `c5cb727`, árbol limpio, build verde, `astro check` 0/0/0.
> **Sesión 2026-06-24 (programa de blog COMPLETO):** se draftearon los **33 candidatos** de
> [BLOG_PLAN.md](BLOG_PLAN.md) en los **6 clusters** (A SRE/Obs 6 · B FinOps 4 · C IaC 6 · D Data 6 ·
> E Research 7 · F Lead-discipline 4). Cada post **EN+ES** (66 `.md`) con **4–5 diagramas** Mermaid→SVG
> (Kroki `theme=dark`, en `public/blog/<en-slug>/` → 33 carpetas), callout "Key insight", sección References
> (externos + internos + interlinks), `astro check` 0/0/0 + build limpio. **TODOS `draft:true`** (invisibles
> en prod, visibles en `npm run dev`). BLOG_PLAN: 0 filas en `idea`. ~16 commits, todos en `main`, Vercel `success`.
> **Sesiones previas (2026-06-23):** `/trinitrade` enriquecido (8 diagramas SVG + repo deep-links), CV `/misael`
> (EN+ES), SEO/JSON-LD + Google Search Console verificado (sitemap procesando), newsletter S-03 (Buttondown en revisión).
>
> **▶️ FOCO PRÓXIMA SESIÓN:** (a) **review de los 33 drafts del blog** (`npm run dev` → localhost:4321) y
> empezar a **publicar 1/semana** flipeando `draft:false` según el orden de [BLOG_PLAN §5](BLOG_PLAN.md);
> (b) **S-20 email** (bloquea CTA) — cablear MX/SPF/DKIM Zoho en Route53; (c) **Search Console** — confirmar
> sitemap "Correcto" + Solicitar indexación de `/`, `/misael`, `/trinitrade`; (d) newsletter S-03 (esperar
> Buttondown) + S-04 OG image + identidades S-21/S-22.

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
- `main` = `c5cb727`, en sync, build verde (~11 páginas), `astro check` 0/0/0.
- **0 incidencias bloqueantes.** Páginas: home, blog, **`/misael` (CV)**, **`/trinitrade` (caso de estudio)**, todas EN+ES.
- **SEO**: JSON-LD (Person/Org/WebSite/TechArticle) + Google Search Console verificado (TXT) + sitemap enviado (procesando).
- **Blog**: 1 post publicado (logs→observabilidad) + **programa COMPLETO: 33/33 candidatos drafteados** (EN+ES = 66 `.md`, 4–5 diagramas SVG + callout + refs cada uno, **todos `draft:true`**), 6 clusters cerrados, [BLOG_PLAN.md](BLOG_PLAN.md) 0 filas en `idea`. **Siguiente: review + publicar 1/semana** flipeando `draft:false`. Assets en `public/blog/<en-slug>/`.
- **Newsletter (S-03)**: form correcto (endpoint `buttondown.com`); cuenta Buttondown **en revisión**.

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
§1+§2 + [BLOG_PLAN.md](BLOG_PLAN.md). Prioridad del día: **(a)** retomar **Search Console** (confirmar sitemap
"Correcto" + Inspección de URL → Solicitar indexación de `/`, `/misael`, `/trinitrade`); **(b)** **review del
draft E1** del blog y seguir drafteando (cluster E o el orden de BLOG_PLAN §5, EN+ES, `draft:true`); **(c)**
newsletter S-03 (esperar aprobación Buttondown); **(d)** S-20 email (bloquea CTA) + S-04 OG image. El sitio ya
está LIVE; el trabajo es contenido + crecimiento + SEO, sin romper el minimalismo ni la marca.

> ⚠️ **Footgun de entorno:** la red corporativa del operador (Palo Alto/Mastercard) **sinkholea `mizolutions.com`**
> → cualquier fetch/curl/navegador desde aquí da **503** (página de bloqueo, NO fallo del sitio). Para verificar
> el sitio en vivo usa `gh api repos/mizolutions/site/commits/<sha>/status` (Vercel=success) o pide al operador
> que lo abra desde su red personal. Push: commit como `Mizolutions`/`ping@mizolutions.com` (gh auth ya configurado).
