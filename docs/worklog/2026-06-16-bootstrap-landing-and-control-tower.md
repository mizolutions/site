# Worklog — 2026-06-16 · Bootstrap de la landing + torre de control

> Primera bitácora del repo `mizolutions/site`. Cubre el arranque del sitio
> (sesiones 2026-06-15→16) y el montaje de esta capa de gobernanza.

## Qué se hizo

### 1. Scaffold de la landing (Astro 5 estático)
- Proyecto Astro 5, `output: 'static'`, TypeScript, dark-mode, **cero JS** por
  defecto. Tokens CSS a mano (`src/styles/tokens.css`), sin framework de UI.
- **Bilingüe EN/ES** (i18n nativo, `/` + `/es`); todo el copy en `src/i18n/ui.ts`.
- Secciones: Hero, Servicios (Cloud / SRE-Observabilidad / IaC), Caso de estudio
  Trinitrade (mocks SVG/CSS redactados de Grafana + alarma CloudWatch), Método,
  Newsletter (embed Buttondown), Footer.
- Blog con Content Collections + 1er post _"From storing logs to real
  observability"_ (EN+ES) en `draft:true`.
- SEO: canonical + hreflang (en/es/x-default), OG/Twitter, sitemap, robots,
  favicon SVG tipográfico. Seguridad: CSP+HSTS+headers en `vercel.json`.
- Validación: `npm run build` verde (5 páginas + sitemap), `astro check` 0/0/0.

### 2. Decisiones de stack/posicionamiento (capturadas como ADR)
- Consultoría-led, Trinitrade = caso de estudio sin P&L (ADR-002).
- Astro estático sobre Next.js (ADR-001); bilingüe EN/ES (ADR-005).
- Subir a **Astro 5** para cerrar CVEs y alinear el plugin de sitemap; los highs
  restantes de `npm audit` (astro/esbuild/vite) se **aceptan** (no aplican al
  build estático) y se documentan en el README.

### 3. Branding cloud-general (AWS → Cloud)
- Reemplazadas todas las menciones de marca "AWS" por "Cloud" en `src/i18n/ui.ts`
  (EN+ES) y en los chips del Hero; "AWS CDK" → "CDK"; tag de blog `aws` → `cloud`.
  Se conservan nombres de herramientas concretas como prueba de craft (ADR-003).

### 4. Repo + deploy
- Repo `mizolutions/site` **privado** creado y pusheado con el PAT existente
  (`gh`, usuario `mizo-tenich`). Primer commit `931bd55`.
- Deploy en **Vercel** (estático) → **Ready**. (El botón de deploy atascado fue
  config de la UI de Vercel, no del repo: `npm ci` + build se reprodujeron verdes
  localmente.)

### 5. DNS
- `mizolutions.com` registrado en **Route53** (cuenta PROD trading `520999258244`),
  zona dedicada `Z062327723TCUEVA9TY8M` (separada de `miz0.com`).
- Aplicado `A mizolutions.com → 216.198.79.1` (TTL 300, UPSERT, change
  `C1000229YUEOSDD5IJ4G`). Resuelve por resolver público. Dominio **Valid** + SSL
  auto en Vercel. Zona **no** delegada a Vercel, **no** en el CDK del trading
  (ADR-004).
- `https://mizolutions.com` confirmado LIVE por el operador. _(Nota: el `curl`
  agente-side falla por egress del bastion corp — mismo motivo que el `dig`
  directo al NS; no es problema del sitio.)_

### 6. Torre de control (esta sesión)
- `docs/control/`: CONTROL_TOWER, RAID, ROADMAP, NEXT_SESSION_PROMPT, README.
- `docs/adr/`: index + ADR-001..005 (decisiones ya tomadas).
- `docs/worklog/`: esta entrada. `CHANGELOG.md` (Keep a Changelog).
- Estructura espejo del repo de trading pero escalada a un sitio landing.

## Estado al cierre
- Sitio **LIVE** y sano. `main` = `931bd55` (+ commit de esta capa de control).
- **0 incidencias bloqueantes.** Pendientes = pulido/crecimiento (ver Top-3 del
  CONTROL_TOWER): publicar el 1er post, identidad real, OG image + analytics.

## Lecciones / footguns registrados
- Vercel cambió la IP apex a `216.198.79.1` (la vieja `76.76.21.21` sigue, pero
  deprecada) → usar siempre lo que muestra la pestaña **DNS Records** de Vercel.
- `@astrojs/sitemap` 3.7.x necesita el hook `astro:routes:resolved` de Astro 5
  (crashea en Astro 4 con `_routes` undefined) → versiones acopladas.
- El repo del sitio vive **fuera** del workspace VS Code → usar terminal + rutas
  absolutas (las herramientas de búsqueda del workspace no lo ven).
