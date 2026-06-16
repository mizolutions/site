# 🚀 Prompt de arranque — próxima sesión (`mizolutions.com`)

> **Qué es esto.** Prompt autocontenido para iniciar la siguiente sesión sobre el
> **sitio landing** (NO el trading-system). Pega el bloque al abrir, o pide "lee
> `docs/control/NEXT_SESSION_PROMPT.md`". **Mantenimiento:** refrescar al cierre de
> cada sesión. Fuente de verdad: [CONTROL_TOWER.md](CONTROL_TOWER.md) +
> [RAID.md](RAID.md) + [ROADMAP.md](ROADMAP.md).
>
> **▶️ ESTADO (cierre 2026-06-16):** el sitio está **LIVE en `https://mizolutions.com`**
> (Astro 5 estático en Vercel, bilingüe EN/ES, DNS Route53→Vercel + SSL). Repo
> `mizolutions/site` **público**, `main` = `f1cec08`, árbol limpio. **3 tareas
> hechas** (S-07 higiene repo, S-01 1er post, S-02 footer honesto). **S-20 (email)
> en curso** = el único pendiente con dependencia humana que **bloquea el CTA**.

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
- `main` = `f1cec08`, en sync, build verde (7 páginas), `astro check` 0/0/0.
- **0 incidencias bloqueantes.** Backlog **23 tareas (S-01..S-23), 3 hechas**.
- 1 post de blog publicado (logs→observabilidad, EN+ES). Footer = GitHub + email.

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
§1+§2, y enfócate en **S-20 (email)** si el operador ya hizo el signup de Zoho
(pídele el TXT de verificación), o en el siguiente del Top-3. El sitio ya está
LIVE; el trabajo es identidad + crecimiento, sin romper el minimalismo ni la marca.
