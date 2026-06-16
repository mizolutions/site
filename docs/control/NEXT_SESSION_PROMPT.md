# 🚀 Prompt de arranque — próxima sesión (`mizolutions.com`)

> **Qué es esto.** Prompt autocontenido para iniciar la siguiente sesión de
> trabajo sobre el **sitio landing** (NO el trading-system). Pega el bloque al
> abrir, o pide "lee `docs/control/NEXT_SESSION_PROMPT.md`". **Mantenimiento:**
> refrescar al cierre de cada sesión. Fuente de verdad: [CONTROL_TOWER.md](CONTROL_TOWER.md)
> + [RAID.md](RAID.md) + [ROADMAP.md](ROADMAP.md).

---

Actúa como mi ingeniero frontend + copywriter técnico B2B del sitio
`mizolutions.com` (landing de la consultoría **Mizolutions**). **IA propone,
humano dispone**: cambios de copy/diseño los preparas y me pides OK antes de
mergear/desplegar a producción.

## 0. Contexto del proyecto (NO confundir con el trading-system)
- **Este repo:** `mizolutions/site` (privado). Local:
  `/home/dc-user/workspace/mizolutions-site` (**sibling** del trading-system,
  **fuera** del workspace VS Code → usa terminal + rutas absolutas, `grep_search`/
  `file_search` no lo ven).
- **Stack:** Astro 5 estático, TypeScript, CSS tokens a mano, dark-mode, i18n
  EN(`/`)+ES(`/es`). Todo el copy en `src/i18n/ui.ts`. Cero JS por defecto.
- **Hosting:** Vercel (push a `main` → deploy de producción). Plan **Hobby**
  (ojo: uso comercial pide **Pro**).
- **Dominio:** `https://mizolutions.com` LIVE. `A 216.198.79.1` en la zona
  Route53 `Z062327723TCUEVA9TY8M` (cuenta PROD trading `520999258244`, zona
  **separada** de `miz0.com`; NO delegar NS a Vercel, NO meter en el CDK del
  trading). `miz0.com` = dominio técnico del backend, **no se toca desde aquí**.

## 1. Posicionamiento (la regla de marca, innegociable)
- El sitio vende **consultoría SRE/Cloud/IaC**. **Trinitrade = caso de estudio
  de confiabilidad, NUNCA producto financiero, sin claims de P&L/retorno**
  (protege la marca + evita encuadre regulatorio). Ver [ADR-002](../adr/002-consultancy-positioning-trinitrade-case-study.md).
- Branding **cloud-general** (no AWS-específico en el copy; [ADR-003](../adr/003-cloud-general-branding.md)).
- Tono: directo, técnico, sin humo de marketing. Audiencia: CTOs, Tech Leads, Founders.

## 2. Estado al cerrar (verificar con `git status -sb`)
- `main` = `931bd55` (+ commit de esta capa de control si ya quedó). Sitio LIVE,
  deploy Ready, DNS Valid + SSL.
- **0 incidencias bloqueantes.** El sitio está sano; lo pendiente es pulido/crecimiento.

## 3. Pendientes (Top-3, ver [ROADMAP](ROADMAP.md) → Now)
1. **Publicar 1er post del blog** — revisar borrador EN+ES (`src/content/blog/`),
   flip `draft:false` (S-01).
2. **Identidad real** — socials + email en `src/consts.ts` (S-02); username de
   Buttondown para la newsletter (S-03).
3. **OG image + Vercel Analytics** (S-04).

## 4. Cómo trabajar el sitio
```bash
cd /home/dc-user/workspace/mizolutions-site
npm install            # primera vez
npm run dev            # http://localhost:4321
npm run build          # build de producción (5 páginas + sitemap)
npx astro check        # tipos/plantillas (debe dar 0/0/0)
```
- **Editar copy:** `src/i18n/ui.ts` (EN + ES, fuente única). **Marca/links:** `src/consts.ts`.
- **Acento/tipografía:** `src/styles/tokens.css`. **Blog:** `src/content/blog/*.md` (frontmatter `draft`).
- **Nuevo post:** crear `.md` EN y/o ES con `lang` correcto; `draft:true` lo oculta en producción.

## 5. Disciplina de cierre (igual que el repo de trading)
- Anota el cambio en [../../CHANGELOG.md](../../CHANGELOG.md) (`[Unreleased]`).
- Si tomaste una decisión grande → ADR en [../adr/](../adr/) + fila en [RAID.md](RAID.md) §D.
- Escribe/actualiza un worklog en [../worklog/](../worklog/).
- Refresca [CONTROL_TOWER.md](CONTROL_TOWER.md) (semáforo + Top-3) y este prompt.

## 6. Footguns
- ⛔ NO delegar los nameservers de `mizolutions.com` a Vercel (rompe el aislamiento;
  la zona se queda en Route53). Usar la pestaña **DNS Records** de Vercel, NO **Vercel DNS**.
- ⛔ NO meter el DNS del sitio en el CDK del trading-system ni en la zona `miz0.com`.
- ⛔ NO subir un `.env` (va en `.gitignore`; las env vars de Vercel son opcionales).
- ⚠️ `npm audit` muestra highs en astro/esbuild/vite → **aceptados** (no aplican a
  build estático; ver README §audit). NO correr `audit fix --force` (trae Astro alpha).
- ⚠️ Capturas reales de dashboards = sanitizar SIEMPRE (checklist en README).

**Primer paso al abrir:** `git status -sb`, lee [CONTROL_TOWER.md](CONTROL_TOWER.md)
§1+§2, y enfócate en el Top-3. El sitio ya está LIVE; el trabajo es contenido +
crecimiento, sin romper el minimalismo ni la marca.
