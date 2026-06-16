# ADR-005: Sitio bilingüe EN/ES con i18n de Astro

**Estado:** Aceptado
**Fecha:** 2026-06-15
**Contexto:** La audiencia B2B SRE/Cloud y la estrategia "build in public" son
mayormente anglófonas, pero el operador está en México y el ICP incluye LATAM.

## Decisión

Sitio **bilingüe** con el i18n nativo de Astro: **inglés como default servido en
`/`** y **español servido en `/es`** (`prefixDefaultLocale: false`). Todo el copy
vive en `src/i18n/ui.ts` (objetos `ui.en` y `ui.es`), fuente única de verdad.

## Razones

1. **Alcance global + cercanía LATAM** sin duplicar mantenimiento de plantillas.
2. **Copy centralizado** = un solo lugar para editar ambos idiomas; los
   componentes solo leen de `ui[lang]`.
3. **SEO correcto:** `hreflang` (en/es/x-default) + `canonical` por locale,
   emitidos en `BaseHead.astro`; selector de idioma en header.

## Consecuencias

- Cada string nuevo debe añadirse en **ambos** idiomas en `src/i18n/ui.ts`.
- Cada post del blog puede existir en EN y/o ES (frontmatter `lang`); las listas
  filtran por idioma.
- El default inglés se sirve sin prefijo (`/`); cambiarlo rompería URLs ya
  indexadas, así que es una decisión durable.
