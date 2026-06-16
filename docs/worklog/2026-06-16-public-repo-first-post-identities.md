# Worklog — 2026-06-16 · Repo público + 1er post + identidades

> Segunda bitácora. Cubre el trabajo tras el bootstrap: flip a público, backlog
> completo, S-07, S-01, S-02 y el arranque de S-20 (email).

## Qué se hizo

### 1. Repo público + backlog completo (S-01..S-23)
- Repo `mizolutions/site` flipeado a **público** (build-in-public, decisión del
  operador; D-06). Dependabot se activó → flagea los highs ya aceptados de
  astro/esbuild/vite (esperado, documentado en README §audit).
- Poblado el backlog completo en [RAID §I](../control/RAID.md) + [ROADMAP](../control/ROADMAP.md):
  23 tareas (content/SEO/infra/gov). Nuevo riesgo R-07 (info disclosure por repo
  público: account-id `520999258244` + zona `Z0623…` visibles en docs).

### 2. S-07 — Higiene del repo público ✅
- `gh repo edit`: description + **13 topics** (astro, sre, reliability-engineering,
  devops, cloud, i18n, …) + **homepage → `mizolutions.com`** (estaba el preview de
  Vercel `site-beta-green-63.vercel.app`). README license corregido (decía "Private").

### 3. S-01 — Primer post del blog publicado ✅
- Flip `draft:false` en _"From storing logs to real observability"_ (EN) +
  _"De guardar logs a tener observabilidad de verdad"_ (ES). Build pasó de 5 a
  **7 páginas**; `astro check` 0/0/0. Enlazado en `/blog`, `/es/blog` y desde la home.
- El WARN de "duplicate id" era caché de dev (`.astro`); en build limpio desaparece
  y Vercel siempre buildea limpio.

### 4. S-02 — Footer honesto + realidad de identidades ✅
- Verificado con datos: **`github.com/mizolutions` SÍ existe** (org del repo);
  **email / LinkedIn / X NO existían**. Footer ahora = GitHub + email reales;
  X/LinkedIn comentados en `src/consts.ts` (cero links muertos). D-08 registrada.
- Tareas de identidad creadas: **S-20** email (CTA blocker), **S-21** LinkedIn,
  **S-22** X, **S-23** pulir perfil del GitHub org.

### 5. S-20 — Email (en curso, bloquea el CTA)
- Dirección elegida = **`ping@mizolutions.com`** (muy on-brand SRE). El sitio ya
  apunta ahí (CTA + footer, EN/ES); proveedor elegido = **Zoho Mail Free**.
- Pendiente colaborativo: el operador hace el signup de Zoho + me pasa el TXT de
  verificación y el DKIM → el agente cablea MX/SPF/DKIM/DMARC en Route53. El
  procedimiento exacto quedó en [NEXT_SESSION_PROMPT §3](../control/NEXT_SESSION_PROMPT.md).

## Estado al cierre
- `main` = `f1cec08`, árbol limpio, build verde (7 páginas), `astro check` 0/0/0.
- Backlog 23 tareas, **3 hechas** (S-07, S-01, S-02). **0 incidencias bloqueantes.**
- Top-3 próxima sesión: **S-20 email** (si el operador ya hizo Zoho), S-21/S-22
  identidades sociales, S-11/S-08 decisiones.

## Commits
`4ab1a30` (público + backlog) → `c8e28c6` (S-07) → `b7c9986` (S-01) →
`2d01062` (S-02 footer honesto) → `f1cec08` (email → ping@).
