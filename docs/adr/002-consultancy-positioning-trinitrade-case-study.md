# ADR-002: Posicionamiento de consultoría; Trinitrade como caso de estudio (sin claims de P&L)

**Estado:** Aceptado
**Fecha:** 2026-06-15
**Contexto:** Mizolutions tiene dos posibles caras: (a) consultoría de ingeniería
SRE/Cloud, y (b) producto/SaaS de trading (Trinitrade). La landing v1 debe elegir
una. Trinitrade está en LIVE-tiny con capital microscópico y sus estrategias
activas son **NO-GO** (sin edge robusto vs SPY pasivo, ver el repo de trading
ADR-014/ADR-019).

## Decisión

La landing **vende consultoría de ingeniería/SRE**. Trinitrade aparece **solo
como caso de estudio de confiabilidad** (SLOs, observabilidad, IaC, chaos drills,
post-mortems), **nunca como producto financiero** y **sin ningún claim de
P&L/retorno**.

## Razones

1. **Integridad de marca.** Vender "señales" o insinuar retornos desde un sistema
   sin edge probado sería el "humo de ganancias rápidas" del que nos desmarcamos.
2. **Riesgo regulatorio = cero por este camino.** Presentar Trinitrade como
   demostración de ingeniería no toca terreno de asesoría de inversión; presentarlo
   como producto de señales/gestión sí lo haría.
3. **Cash-flow real hoy.** La consultoría es vendible ya; Trinitrade es la prueba
   de craft ("mira la confiabilidad que construí para mi propio sistema crítico").

## Consecuencias

- El copy de la landing NO incluye P&L, retornos ni promesas de rendimiento.
- Las capturas de dashboards van **redactadas** (sin equity, ARNs, hostnames, PII).
- Las vías SaaS / asset-management quedan como futuro, detrás de credibilidad
  "build in public".
- Cualquier sección que roce "producto de inversión" requiere re-evaluar este ADR.
