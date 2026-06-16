# ADR-001: Astro estático sobre Next.js para la landing + blog

**Estado:** Aceptado
**Fecha:** 2026-06-15
**Contexto:** Lanzamos la presencia web de Mizolutions con filosofía "ingeniería
sobre diseño": minimalismo extremo, dark-mode, cero mantenimiento de servidores.
El sitio es una landing de consultoría + un blog técnico ("build in public").

## Decisión

Usar **Astro** con salida **estática** (`output: 'static'`) en Vercel, en lugar
de Next.js.

## Razones

1. **Cero JS por defecto** (islands) → Lighthouse alto, huella mínima, coherente
   con la marca de ingeniería.
2. **Content Collections** (Markdown/MDX tipado) = ideal para blog + post-mortems.
3. **Más simple que Next** para un sitio de contenido: sin App Router, RSC ni
   runtime de servidor que no necesitamos.
4. **Salida estática = $0 de serverless** en Vercel, servida en edge; sin
   superficie de ataque de SSR.

## Consecuencias

- La landing y el blog son HTML estático; no hay backend en este repo.
- Si nace un **SaaS** (auth, dashboards de señales, API), irá en un proyecto
  **separado** (`app.mizolutions.com`, probablemente Next.js) — NO se acopla a la
  landing.
- El blog usa Content Collections con frontmatter tipado (`draft`, `lang`, `tags`).

## Alternativas consideradas

- **Next.js:** potente para apps, pero sobra para una landing estática; añade
  complejidad de runtime. Se reserva para el SaaS futuro.
- **Cloudflare Pages:** hosting estático gratis que permite uso comercial; queda
  como alternativa a Vercel si el plan Hobby (no-comercial) se vuelve un problema.
